BEGIN;

-- ============================================================================
-- ELVAVEO META DATA DELETION COMPLIANCE HARDENING MIGRATION
-- Adds user_id_hash for PII minimization, concurrency protection, and
-- strict idempotency support without indefinitely retaining raw user IDs.
-- ============================================================================

-- 1. Add user_id_hash column
ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS user_id_hash VARCHAR(64);

-- 2. Populate user_id_hash for existing records using SHA-256
UPDATE public.meta_data_deletion_requests
SET user_id_hash = encode(digest(user_id, 'sha256'), 'hex')
WHERE user_id_hash IS NULL AND user_id IS NOT NULL;

-- 3. Make raw user_id column nullable so raw Meta PII is not permanently retained
ALTER TABLE public.meta_data_deletion_requests
ALTER COLUMN user_id DROP NOT NULL;

-- 4. Make completed_at nullable for pending/processing/failed records
ALTER TABLE public.meta_data_deletion_requests
ALTER COLUMN completed_at DROP NOT NULL;

-- 5. Add unique index on user_id_hash to prevent simultaneous duplicate deletions
CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_deletion_user_id_hash 
ON public.meta_data_deletion_requests(user_id_hash);

-- 6. Add retention/cleanup comment on table
COMMENT ON TABLE public.meta_data_deletion_requests IS 
'Stores Meta Data Deletion compliance receipts. Retains user_id_hash for idempotency and status check receipts for 90 days. Raw user_id is purged upon completion.';

COMMIT;
