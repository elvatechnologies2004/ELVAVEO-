BEGIN;

-- ============================================================================
-- ELVAVEO META DATA DELETION COMPLIANCE HARDENING MIGRATION (V5)
-- Safe PII Expungement, Fenced Claim Tokens, Lease Renewal, Table Privilege Hardening & Restrictive RLS
-- ============================================================================

-- 0. Ensure pgcrypto extension is available for cryptographic digests and UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add required hardening columns
ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS user_id_hash VARCHAR(100);

ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS hash_version VARCHAR(50) DEFAULT 'v1-sha256';

-- Ensure hash_version has sufficient length for all version identifiers
ALTER TABLE public.meta_data_deletion_requests 
ALTER COLUMN hash_version TYPE VARCHAR(50);

ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS claim_token UUID;

-- 2. Correct timestamp defaults to ensure pure TIMESTAMPTZ now() behavior
ALTER TABLE public.meta_data_deletion_requests 
ALTER COLUMN requested_at SET DEFAULT now();

ALTER TABLE public.meta_data_deletion_requests 
ALTER COLUMN completed_at DROP DEFAULT;

ALTER TABLE public.meta_data_deletion_requests 
ALTER COLUMN completed_at DROP NOT NULL;

-- ============================================================================
-- 3. MIGRATION ORDERING: BACKFILL FIRST, VERIFY STRICTLY, THEN EXPUNGE & ALTER
-- ============================================================================

-- Step A: Backfill user_id_hash and hash_version for existing rows where user_id is present
UPDATE public.meta_data_deletion_requests
SET user_id_hash = encode(digest(trim(user_id), 'sha256'), 'hex'),
    hash_version = COALESCE(hash_version, 'v1-sha256')
WHERE user_id_hash IS NULL AND user_id IS NOT NULL;

-- Step B: STRICT INTEGRITY VERIFICATION
-- Verify every existing row with non-null user_id has a valid, non-null, 64-char hex hash.
-- If any row fails, abort the transaction with an explicit error. Never silently discard identities.
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

-- Step C: SAFE PII EXPUNGEMENT
-- Only after 100% hash verification succeeds, expunge raw user_id values
UPDATE public.meta_data_deletion_requests
SET user_id = NULL
WHERE user_id IS NOT NULL;

-- Step D: Alter user_id column nullability only after expungement
ALTER TABLE public.meta_data_deletion_requests
ALTER COLUMN user_id DROP NOT NULL;

-- 4. Performance indexes (Non-unique to safely preserve all historical receipts and duplicates)
CREATE INDEX IF NOT EXISTS idx_meta_deletion_user_id_hash 
ON public.meta_data_deletion_requests(user_id_hash);

CREATE INDEX IF NOT EXISTS idx_meta_deletion_locked_until 
ON public.meta_data_deletion_requests(locked_until);

-- ============================================================================
-- 5. ATOMIC CONCURRENCY CLAIM RPC FUNCTION
-- Uses stable HMAC canonical lock to serialize concurrent requests across versions,
-- validates lease duration (10s to 3600s), and issues a fenced claim_token (UUID).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_meta_data_deletion(
    p_canonical_lock_hash VARCHAR(100),
    p_primary_user_id_hash VARCHAR(100),
    p_hash_version VARCHAR(50),
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
    v_lease_expiry TIMESTAMPTZ;
    v_claim_token UUID;
BEGIN
    -- Validate lease duration strictly
    IF p_lease_seconds < 10 OR p_lease_seconds > 3600 THEN
        RAISE EXCEPTION 'Invalid lease duration: % seconds. Must be between 10 and 3600 seconds.', p_lease_seconds;
    END IF;

    v_lease_expiry := v_now + (p_lease_seconds || ' seconds')::INTERVAL;

    -- Acquire transaction advisory lock on canonical HMAC hash to serialize concurrent requests
    -- across secret rotations or rolling deployment instances.
    PERFORM pg_advisory_xact_lock(hashtext(p_canonical_lock_hash));

    -- Locate latest existing record matching any candidate hash (current HMAC, rotated HMAC, or legacy SHA-256)
    SELECT * INTO v_existing
    FROM public.meta_data_deletion_requests
    WHERE user_id_hash = ANY(p_candidate_hashes)
    ORDER BY requested_at DESC, id DESC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
        -- Case 1: Already completed. Return existing confirmation code idempotently without claim.
        IF v_existing.status = 'completed' THEN
            RETURN jsonb_build_object(
                'claimed', false,
                'status', 'completed',
                'confirmation_code', v_existing.confirmation_code,
                'claim_token', NULL,
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
                'claim_token', NULL,
                'is_repeat', true,
                'requested_at', v_existing.requested_at,
                'locked_until', v_existing.locked_until,
                'reason', 'active_lease'
            );
        END IF;

        -- Case 3: Status is pending, failed, or lease has expired (stale/crashed worker).
        -- Safely reclaim lease with a fresh unique claim_token and retry using the same confirmation code!
        v_claim_token := gen_random_uuid();

        UPDATE public.meta_data_deletion_requests
        SET status = 'processing',
            locked_until = v_lease_expiry,
            claim_token = v_claim_token,
            user_id_hash = p_primary_user_id_hash,
            hash_version = p_hash_version,
            details = COALESCE(details, '{}'::jsonb) || p_details
        WHERE id = v_existing.id;

        RETURN jsonb_build_object(
            'claimed', true,
            'status', 'processing',
            'confirmation_code', v_existing.confirmation_code,
            'claim_token', v_claim_token,
            'is_repeat', true,
            'requested_at', v_existing.requested_at,
            'locked_until', v_lease_expiry,
            'reason', 'reclaimed_lease'
        );
    ELSE
        -- Case 4: No previous record exists. Atomically insert new record with fresh claim_token.
        v_claim_token := gen_random_uuid();

        INSERT INTO public.meta_data_deletion_requests (
            confirmation_code,
            user_id_hash,
            hash_version,
            status,
            requested_at,
            completed_at,
            locked_until,
            claim_token,
            details
        ) VALUES (
            p_confirmation_code,
            p_primary_user_id_hash,
            p_hash_version,
            'processing',
            v_now,
            NULL,
            v_lease_expiry,
            v_claim_token,
            p_details
        );

        RETURN jsonb_build_object(
            'claimed', true,
            'status', 'processing',
            'confirmation_code', p_confirmation_code,
            'claim_token', v_claim_token,
            'is_repeat', false,
            'requested_at', v_now,
            'locked_until', v_lease_expiry,
            'reason', 'new_request'
        );
    END IF;
END;
$$;

-- ============================================================================
-- 6. ATOMIC FINALIZE RPC FUNCTION
-- Enforces claim_token fencing, unexpired lease check, and prevents overwriting completed records.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.finalize_meta_data_deletion(
    p_confirmation_code VARCHAR(100),
    p_claim_token UUID,
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

    -- Fencing check: reject stale worker whose claim_token no longer matches active lease
    IF v_existing.claim_token IS NULL OR v_existing.claim_token != p_claim_token THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'stale_claim_token',
            'confirmation_code', p_confirmation_code
        );
    END IF;

    -- Require lease to still be active (unexpired) at time of finalization
    IF v_existing.locked_until IS NULL OR v_existing.locked_until <= v_now THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'lease_expired',
            'confirmation_code', p_confirmation_code
        );
    END IF;

    -- Finalize status, record completed_at timestamp, clear lease and claim token
    UPDATE public.meta_data_deletion_requests
    SET status = p_status,
        completed_at = CASE WHEN p_status = 'completed' THEN v_now ELSE NULL END,
        locked_until = NULL,
        claim_token = NULL,
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
-- 7. ATOMIC LEASE RENEWAL RPC FUNCTION
-- Allows legitimate long-running worker operations to extend an active lease.
-- Requires matching claim_token and active unexpired lease.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.renew_meta_data_deletion_lease(
    p_confirmation_code VARCHAR(100),
    p_claim_token UUID,
    p_extension_seconds INT DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := now();
    v_existing RECORD;
    v_new_expiry TIMESTAMPTZ;
BEGIN
    -- Validate extension duration
    IF p_extension_seconds < 10 OR p_extension_seconds > 3600 THEN
        RAISE EXCEPTION 'Invalid extension duration: % seconds. Must be between 10 and 3600 seconds.', p_extension_seconds;
    END IF;

    v_new_expiry := v_now + (p_extension_seconds || ' seconds')::INTERVAL;

    SELECT * INTO v_existing
    FROM public.meta_data_deletion_requests
    WHERE confirmation_code = p_confirmation_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'record_not_found');
    END IF;

    IF v_existing.status != 'processing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_state_transition', 'current_status', v_existing.status);
    END IF;

    IF v_existing.claim_token IS NULL OR v_existing.claim_token != p_claim_token THEN
        RETURN jsonb_build_object('success', false, 'reason', 'stale_claim_token');
    END IF;

    IF v_existing.locked_until IS NULL OR v_existing.locked_until <= v_now THEN
        RETURN jsonb_build_object('success', false, 'reason', 'lease_already_expired');
    END IF;

    UPDATE public.meta_data_deletion_requests
    SET locked_until = v_new_expiry
    WHERE confirmation_code = p_confirmation_code;

    RETURN jsonb_build_object(
        'success', true,
        'confirmation_code', p_confirmation_code,
        'locked_until', v_new_expiry
    );
END;
$$;

-- ============================================================================
-- 8. TABLE PRIVILEGES AUDIT & HARDENING
-- Revoke all direct table privileges from PUBLIC, anon, and authenticated.
-- Explicitly grant table permissions only to service_role and postgres owner.
-- ============================================================================
REVOKE ALL ON TABLE public.meta_data_deletion_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meta_data_deletion_requests TO service_role;
GRANT ALL ON TABLE public.meta_data_deletion_requests TO postgres;

-- ============================================================================
-- 9. AUDIT & ENFORCE RESTRICTIVE ROW LEVEL SECURITY
-- Original policy documented: "Deny all public on meta_data_deletion_requests" (anon, authenticated USING false).
-- Dropped and replaced with an explicit AS RESTRICTIVE policy to prevent any future permissive leaks.
-- ============================================================================
DROP POLICY IF EXISTS "Deny all public on meta_data_deletion_requests" ON public.meta_data_deletion_requests;
DROP POLICY IF EXISTS "deny_all_access_meta_data_deletion_requests" ON public.meta_data_deletion_requests;

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
-- 10. RPC FUNCTION PERMISSIONS (Exact signature verification)
-- Strictly grants execution only to service_role; fully revokes from PUBLIC, anon, authenticated.
-- ============================================================================
REVOKE ALL ON FUNCTION public.claim_meta_data_deletion(character varying, character varying, character varying, character varying[], character varying, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_meta_data_deletion(character varying, character varying, character varying, character varying[], character varying, integer, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.finalize_meta_data_deletion(character varying, uuid, character varying, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_meta_data_deletion(character varying, uuid, character varying, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.renew_meta_data_deletion_lease(character varying, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.renew_meta_data_deletion_lease(character varying, uuid, integer) TO service_role;

COMMIT;
