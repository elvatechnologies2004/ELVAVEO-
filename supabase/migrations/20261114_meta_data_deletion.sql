BEGIN;

-- ============================================================================
-- ELVAVEO META DATA DELETION REQUESTS TABLE
-- Tracks compliance with Meta Platform Terms for User Data Deletion Callback
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meta_data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    confirmation_code VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    details JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_meta_deletion_user_id ON public.meta_data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_deletion_code ON public.meta_data_deletion_requests(confirmation_code);

ALTER TABLE public.meta_data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Deny public and anon direct access (Service role only)
DROP POLICY IF EXISTS "Deny all public on meta_data_deletion_requests" ON public.meta_data_deletion_requests;
CREATE POLICY "Deny all public on meta_data_deletion_requests"
ON public.meta_data_deletion_requests FOR ALL
TO anon, authenticated
USING (false);

COMMIT;
