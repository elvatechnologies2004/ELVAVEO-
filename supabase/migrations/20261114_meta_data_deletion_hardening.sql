BEGIN;

-- ============================================================================
-- ELVAVEO META DATA DELETION COMPLIANCE HARDENING MIGRATION (V3)
-- Atomic Claim/Lease Concurrency, Data Minimization, Hash Versioning & Zero Data Loss
-- ============================================================================

-- 0. Ensure pgcrypto extension is available for cryptographic digests
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add user_id_hash column for PII minimization and lookup
ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS user_id_hash VARCHAR(100);

-- 2. Add hash_version column to identify algorithm and key version (v1-sha256, v2-hmac-sha256)
ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS hash_version VARCHAR(20) DEFAULT 'v1-sha256';

-- 3. Add locked_until column for durable cross-instance concurrency lease
ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- 4. Populate user_id_hash and hash_version for any existing legacy records where null
UPDATE public.meta_data_deletion_requests
SET user_id_hash = encode(digest(user_id, 'sha256'), 'hex'),
    hash_version = COALESCE(hash_version, 'v1-sha256')
WHERE user_id_hash IS NULL AND user_id IS NOT NULL;

-- 5. Make user_id nullable so raw PII does not have to be permanently stored
ALTER TABLE public.meta_data_deletion_requests
ALTER COLUMN user_id DROP NOT NULL;

-- 6. Make completed_at nullable for pending/processing/failed records
ALTER TABLE public.meta_data_deletion_requests
ALTER COLUMN completed_at DROP NOT NULL;

-- 7. Performance indexes (Non-unique to safely preserve all historical receipts and duplicates)
CREATE INDEX IF NOT EXISTS idx_meta_deletion_user_id_hash 
ON public.meta_data_deletion_requests(user_id_hash);

CREATE INDEX IF NOT EXISTS idx_meta_deletion_locked_until 
ON public.meta_data_deletion_requests(locked_until);

-- ============================================================================
-- ATOMIC CONCURRENCY CLAIM RPC FUNCTION
-- Atomically acquires a durable lease or returns existing completed confirmation code.
-- Guarantees cross-instance concurrency safety without row deletion or unique index conflicts.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_meta_data_deletion(
    p_primary_user_id_hash VARCHAR(100),
    p_hash_version VARCHAR(20),
    p_candidate_hashes VARCHAR(100)[],
    p_confirmation_code VARCHAR(100),
    p_lease_seconds INT DEFAULT 300,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_lease_expiry TIMESTAMPTZ := v_now + (p_lease_seconds || ' seconds')::INTERVAL;
BEGIN
    -- Acquire transaction advisory lock on primary hash to strictly serialize concurrent requests
    PERFORM pg_advisory_xact_lock(hashtext(p_primary_user_id_hash));

    -- Locate latest existing record matching any candidate hash (current HMAC, rotated HMAC, or legacy SHA-256)
    SELECT * INTO v_existing
    FROM public.meta_data_deletion_requests
    WHERE user_id_hash = ANY(p_candidate_hashes)
    ORDER BY requested_at DESC, id DESC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
        -- Case 1: Already completed. Return existing confirmation code idempotently.
        IF v_existing.status = 'completed' THEN
            RETURN jsonb_build_object(
                'claimed', false,
                'status', 'completed',
                'confirmation_code', v_existing.confirmation_code,
                'is_repeat', true,
                'requested_at', v_existing.requested_at,
                'completed_at', v_existing.completed_at,
                'reason', 'already_completed'
            );
        END IF;

        -- Case 2: Actively processing with a valid unexpired lease. Refuse duplicate claim.
        IF v_existing.status = 'processing' AND v_existing.locked_until IS NOT NULL AND v_existing.locked_until > v_now THEN
            RETURN jsonb_build_object(
                'claimed', false,
                'status', 'processing',
                'confirmation_code', v_existing.confirmation_code,
                'is_repeat', true,
                'requested_at', v_existing.requested_at,
                'locked_until', v_existing.locked_until,
                'reason', 'active_lease'
            );
        END IF;

        -- Case 3: Status is pending, failed, or lease has expired (stale/crashed worker).
        -- Safely reclaim lease and retry using the same confirmation code!
        UPDATE public.meta_data_deletion_requests
        SET status = 'processing',
            locked_until = v_lease_expiry,
            user_id_hash = p_primary_user_id_hash,
            hash_version = p_hash_version,
            details = COALESCE(details, '{}'::jsonb) || p_details
        WHERE id = v_existing.id;

        RETURN jsonb_build_object(
            'claimed', true,
            'status', 'processing',
            'confirmation_code', v_existing.confirmation_code,
            'is_repeat', true,
            'requested_at', v_existing.requested_at,
            'locked_until', v_lease_expiry,
            'reason', 'reclaimed_lease'
        );
    ELSE
        -- Case 4: No previous record exists. Atomically insert new record with active lease.
        INSERT INTO public.meta_data_deletion_requests (
            confirmation_code,
            user_id_hash,
            hash_version,
            status,
            requested_at,
            completed_at,
            locked_until,
            details
        ) VALUES (
            p_confirmation_code,
            p_primary_user_id_hash,
            p_hash_version,
            'processing',
            v_now,
            NULL,
            v_lease_expiry,
            p_details
        );

        RETURN jsonb_build_object(
            'claimed', true,
            'status', 'processing',
            'confirmation_code', p_confirmation_code,
            'is_repeat', false,
            'requested_at', v_now,
            'locked_until', v_lease_expiry,
            'reason', 'new_request'
        );
    END IF;
END;
$$;

-- ============================================================================
-- ATOMIC FINALIZE RPC FUNCTION
-- Sets final status and clears lease upon completion or recorded failure.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.finalize_meta_data_deletion(
    p_confirmation_code VARCHAR(100),
    p_status VARCHAR(20),
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    UPDATE public.meta_data_deletion_requests
    SET status = p_status,
        completed_at = CASE WHEN p_status = 'completed' THEN v_now ELSE NULL END,
        locked_until = NULL,
        details = COALESCE(details, '{}'::jsonb) || p_details
    WHERE confirmation_code = p_confirmation_code;

    RETURN jsonb_build_object(
        'success', FOUND,
        'confirmation_code', p_confirmation_code,
        'status', p_status
    );
END;
$$;

-- 8. Ensure RLS remains enabled and forced
ALTER TABLE public.meta_data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_data_deletion_requests FORCE ROW LEVEL SECURITY;

-- 9. Explicitly maintain strict denial for public and anon roles
DROP POLICY IF EXISTS "Deny all public on meta_data_deletion_requests" ON public.meta_data_deletion_requests;
CREATE POLICY "Deny all public on meta_data_deletion_requests"
ON public.meta_data_deletion_requests FOR ALL
TO anon, authenticated
USING (false);

-- 10. Secure RPC permissions (Service Role only)
REVOKE ALL ON FUNCTION public.claim_meta_data_deletion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_meta_data_deletion TO service_role;

REVOKE ALL ON FUNCTION public.finalize_meta_data_deletion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_meta_data_deletion TO service_role;

COMMIT;
