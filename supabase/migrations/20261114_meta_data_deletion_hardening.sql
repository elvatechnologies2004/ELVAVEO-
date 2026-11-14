BEGIN;

-- ============================================================================
-- ELVAVEO META DATA DELETION COMPLIANCE HARDENING MIGRATION (V2)
-- Idempotency, Data Minimization, Atomic Lease Concurrency & Repeatable Safety
-- ============================================================================

-- 0. Ensure pgcrypto extension is available for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add user_id_hash column for PII minimization and lookup
ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS user_id_hash VARCHAR(64);

-- 2. Add locked_until column for durable cross-instance concurrency lease
ALTER TABLE public.meta_data_deletion_requests 
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- 3. Populate user_id_hash for any existing records where it is currently null
UPDATE public.meta_data_deletion_requests
SET user_id_hash = encode(digest(user_id, 'sha256'), 'hex')
WHERE user_id_hash IS NULL AND user_id IS NOT NULL;

-- 4. Safe pre-deduplication to guarantee UNIQUE constraint safety
-- If any duplicate rows exist from earlier testing, retain the most recently requested one
DELETE FROM public.meta_data_deletion_requests a
USING public.meta_data_deletion_requests b
WHERE a.id < b.id 
  AND a.user_id_hash = b.user_id_hash
  AND a.user_id_hash IS NOT NULL;

-- 5. Make user_id nullable so raw PII does not have to be permanently stored
ALTER TABLE public.meta_data_deletion_requests
ALTER COLUMN user_id DROP NOT NULL;

-- 6. Make completed_at nullable for pending/processing/failed records
ALTER TABLE public.meta_data_deletion_requests
ALTER COLUMN completed_at DROP NOT NULL;

-- 7. Add unique index on user_id_hash to prevent duplicate deletions across serverless instances
CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_deletion_user_id_hash 
ON public.meta_data_deletion_requests(user_id_hash);

-- 8. Ensure RLS remains enabled and forced
ALTER TABLE public.meta_data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_data_deletion_requests FORCE ROW LEVEL SECURITY;

-- 9. Explicitly maintain strict denial for public and anon roles
DROP POLICY IF EXISTS "Deny all public on meta_data_deletion_requests" ON public.meta_data_deletion_requests;
CREATE POLICY "Deny all public on meta_data_deletion_requests"
ON public.meta_data_deletion_requests FOR ALL
TO anon, authenticated
USING (false);

COMMIT;
