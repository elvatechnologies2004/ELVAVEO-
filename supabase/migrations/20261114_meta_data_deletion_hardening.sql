BEGIN;

-- ============================================================================
-- ELVAVEO META DATA DELETION COMPLIANCE HARDENING MIGRATION (V4)
-- Verified Safe PII Expungement, Canonical Advisory Lock, Strict RPC Signatures & Restrictive RLS
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

-- 4. Make user_id and completed_at nullable if not already nullable
ALTER TABLE public.meta_data_deletion_requests
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.meta_data_deletion_requests
ALTER COLUMN completed_at DROP NOT NULL;

-- 5. Backfill user_id_hash and hash_version for existing rows where user_id is present
UPDATE public.meta_data_deletion_requests
SET user_id_hash = encode(digest(trim(user_id), 'sha256'), 'hex'),
    hash_version = COALESCE(hash_version, 'v1-sha256')
WHERE user_id_hash IS NULL AND user_id IS NOT NULL;

-- 6. STRICT INTEGRITY VERIFICATION
-- Verify every existing row with non-null user_id has a valid, non-null, 64-char hex hash.
-- If any row fails, abort the migration with an explicit error. Never silently discard identities.
DO $$
DECLARE
    v_unhashed_count INT;
    v_invalid_hash_count INT;
BEGIN
    SELECT COUNT(*) INTO v_unhashed_count
    FROM public.meta_data_deletion_requests
    WHERE user_id IS NOT NULL AND user_id_hash IS NULL;

    IF v_unhashed_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: % row(s) with non-null user_id have no user_id_hash. Raw user IDs cannot be removed safely.', v_unhashed_count;
    END IF;

    SELECT COUNT(*) INTO v_invalid_hash_count
    FROM public.meta_data_deletion_requests
    WHERE user_id IS NOT NULL AND (length(user_id_hash) < 64 OR user_id_hash !~ '^[a-f0-9]{64}$');

    IF v_invalid_hash_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: % row(s) have invalid user_id_hash format. Raw user IDs cannot be removed safely.', v_invalid_hash_count;
    END IF;
END $$;

-- 7. SAFE PII EXPUNGEMENT
-- Only after 100% hash verification succeeds, expunge raw user_id values to minimize retained PII.
UPDATE public.meta_data_deletion_requests
SET user_id = NULL
WHERE user_id IS NOT NULL;

-- 8. Performance indexes (Non-unique to safely preserve all historical receipts and duplicates)
CREATE INDEX IF NOT EXISTS idx_meta_deletion_user_id_hash 
ON public.meta_data_deletion_requests(user_id_hash);

CREATE INDEX IF NOT EXISTS idx_meta_deletion_locked_until 
ON public.meta_data_deletion_requests(locked_until);

-- ============================================================================
-- 9. ATOMIC CONCURRENCY CLAIM RPC FUNCTION
-- Uses canonical unkeyed SHA-256 for cross-version advisory lock safety during deployments
-- and key rotation, guaranteeing exactly one active claim per Meta identity at a time.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_meta_data_deletion(
    p_canonical_lock_hash VARCHAR(100),
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
    v_now TIMESTAMPTZ := now();
    v_lease_expiry TIMESTAMPTZ := v_now + (p_lease_seconds || ' seconds')::INTERVAL;
BEGIN
    -- Acquire transaction advisory lock on canonical unkeyed hash to strictly serialize concurrent requests
    -- regardless of secret rotation or mixed application versions during rolling deploys.
    PERFORM pg_advisory_xact_lock(hashtext(p_canonical_lock_hash));

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
-- 10. ATOMIC FINALIZE RPC FUNCTION
-- Validates allowed status values and transitions; prevents overwriting completed records.
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
    v_now TIMESTAMPTZ := now();
    v_existing RECORD;
BEGIN
    -- Strict status validation: only completed or failed are permitted
    IF p_status NOT IN ('completed', 'failed') THEN
        RAISE EXCEPTION 'Invalid target status for finalize_meta_data_deletion: %. Allowed values are completed or failed.', p_status;
    END IF;

    -- Locate the row with row-level lock
    SELECT * INTO v_existing
    FROM public.meta_data_deletion_requests
    WHERE confirmation_code = p_confirmation_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'record_not_found',
            'confirmation_code', p_confirmation_code
        );
    END IF;

    -- Idempotency protection: never overwrite or downgrade an already completed deletion
    IF v_existing.status = 'completed' THEN
        RETURN jsonb_build_object(
            'success', true,
            'reason', 'already_completed',
            'confirmation_code', p_confirmation_code,
            'status', 'completed'
        );
    END IF;

    -- Guard against finalizing an unclaimed or non-processing request
    IF v_existing.status != 'processing' THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'invalid_state_transition',
            'current_status', v_existing.status,
            'confirmation_code', p_confirmation_code
        );
    END IF;

    -- Finalize status, record completed_at timestamp, and release the concurrency lease
    UPDATE public.meta_data_deletion_requests
    SET status = p_status,
        completed_at = CASE WHEN p_status = 'completed' THEN v_now ELSE NULL END,
        locked_until = NULL,
        details = COALESCE(details, '{}'::jsonb) || p_details
    WHERE confirmation_code = p_confirmation_code;

    RETURN jsonb_build_object(
        'success', true,
        'confirmation_code', p_confirmation_code,
        'status', p_status,
        'completed_at', CASE WHEN p_status = 'completed' THEN v_now ELSE NULL END
    );
END;
$$;

-- ============================================================================
-- 11. AUDIT & ENFORCE RESTRICTIVE ROW LEVEL SECURITY
-- Drops all existing policies to eliminate permissive leaks, enables and forces RLS,
-- and creates an explicit RESTRICTIVE policy denying all public, anon, and authenticated access.
-- ============================================================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'meta_data_deletion_requests' 
          AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.meta_data_deletion_requests', r.policyname);
    END LOOP;
END $$;

ALTER TABLE public.meta_data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_data_deletion_requests FORCE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_access_meta_data_deletion_requests"
ON public.meta_data_deletion_requests
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- ============================================================================
-- 12. RPC FUNCTION PERMISSIONS (Exact signature verification)
-- Strictly grants execution only to service_role; fully revokes from PUBLIC, anon, authenticated.
-- ============================================================================
REVOKE ALL ON FUNCTION public.claim_meta_data_deletion(character varying, character varying, character varying, character varying[], character varying, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_meta_data_deletion(character varying, character varying, character varying, character varying[], character varying, integer, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.finalize_meta_data_deletion(character varying, character varying, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_meta_data_deletion(character varying, character varying, jsonb) TO service_role;

COMMIT;
