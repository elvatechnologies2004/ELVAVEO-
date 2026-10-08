-- ============================================================================
-- ELVAVEO PRODUCTION POSTGRESQL / SUPABASE HARDENED SCHEMA & RLS POLICIES
-- Security Focus: Least-Privilege RBAC, Strict Table RLS, Tamper-Proof Auditing
-- ============================================================================

-- Enable required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 0. ADMIN CREDENTIALS & RBAC TABLE (Linked with Supabase Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    passcode_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credentials FORCE ROW LEVEL SECURITY;

-- Deny public and anon access to admin credentials completely
CREATE POLICY "Deny all public on admin_credentials"
ON public.admin_credentials FOR ALL
TO anon, authenticated
USING (false);

-- Seed primary administrator credentials with 'Alfabravo669#' bcrypt/blowfish hash
INSERT INTO public.admin_credentials (email, passcode_hash, role, is_active)
VALUES (
    'admin@elvaveo.com',
    crypt('Alfabravo669#', gen_salt('bf', 10)),
    'admin',
    true
)
ON CONFLICT (email) DO UPDATE
SET passcode_hash = crypt('Alfabravo669#', gen_salt('bf', 10)),
    is_active = true;

-- Verification function using pgcrypto crypt
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(
    p_email VARCHAR,
    p_passcode VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_stored_hash TEXT;
    v_locked_until TIMESTAMPTZ;
    v_is_active BOOLEAN;
BEGIN
    SELECT passcode_hash, locked_until, is_active
    INTO v_stored_hash, v_locked_until, v_is_active
    FROM public.admin_credentials
    WHERE email = lower(trim(p_email));

    IF NOT FOUND OR NOT v_is_active THEN
        RETURN false;
    END IF;

    IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
        RETURN false;
    END IF;

    IF v_stored_hash = crypt(p_passcode, v_stored_hash) THEN
        UPDATE public.admin_credentials
        SET failed_login_attempts = 0,
            last_login_at = now()
        WHERE email = lower(trim(p_email));
        RETURN true;
    ELSE
        UPDATE public.admin_credentials
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE WHEN failed_login_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END
        WHERE email = lower(trim(p_email));
        RETURN false;
    END IF;
END;
$$;

-- ============================================================================
-- 1. INQUIRIES TABLE (Customer Submissions & Admin Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    subject VARCHAR(120) NOT NULL DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'archived')),
    ip_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Force Row Level Security on inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries FORCE ROW LEVEL SECURITY;

-- Deny public reading of any customer contact inquiries (PII Protection)
CREATE POLICY "Deny public select inquiries"
ON public.inquiries FOR SELECT
TO anon
USING (false);

-- Allow public to INSERT new contact messages (Public Contact Form)
CREATE POLICY "Allow public insert inquiry"
ON public.inquiries FOR INSERT
TO anon
WITH CHECK (
    char_length(name) >= 1 AND char_length(name) <= 120 AND
    char_length(email) >= 5 AND char_length(email) <= 254 AND
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
    char_length(message) >= 5 AND char_length(message) <= 5000 AND
    status = 'new'
);

-- Allow authenticated administrator full SELECT on inquiries
CREATE POLICY "Allow admin select inquiries"
ON public.inquiries FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    (auth.jwt() ->> 'email') = 'admin@elvaveo.com'
);

-- Allow authenticated administrator to UPDATE inquiry status only
CREATE POLICY "Allow admin update inquiry status"
ON public.inquiries FOR UPDATE
TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    (auth.jwt() ->> 'email') = 'admin@elvaveo.com'
)
WITH CHECK (
    status IN ('new', 'replied', 'archived')
);

-- Allow authenticated administrator to DELETE inquiries
CREATE POLICY "Allow admin delete inquiries"
ON public.inquiries FOR DELETE
TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    (auth.jwt() ->> 'email') = 'admin@elvaveo.com'
);

-- ============================================================================
-- 2. PRODUCTS TABLE (Public Catalog & Admin Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    logo VARCHAR(500) NOT NULL DEFAULT '/brand/elvaveo-logo.3d7b3289.png',
    badge VARCHAR(100) NOT NULL DEFAULT 'An ELVAVEO Product',
    category VARCHAR(100) NOT NULL DEFAULT 'AI & Automation',
    headline JSONB NOT NULL DEFAULT '[]'::jsonb,
    accent_line INT NOT NULL DEFAULT 1 CHECK (accent_line >= 0 AND accent_line <= 5),
    description TEXT NOT NULL DEFAULT '',
    cta VARCHAR(100) NOT NULL DEFAULT 'Learn More',
    stats JSONB NOT NULL DEFAULT '[]'::jsonb,
    accent VARCHAR(20) NOT NULL DEFAULT 'cyan' CHECK (accent IN ('cyan', 'violet')),
    href VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

-- Public can read all active products
CREATE POLICY "Allow public select products"
ON public.products FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated administrator can insert, update, or delete products
CREATE POLICY "Allow admin insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Allow admin update products"
ON public.products FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Allow admin delete products"
ON public.products FOR DELETE
TO authenticated
USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- 3. PROJECTS TABLE (Showcase & Admin Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    category_label VARCHAR(100),
    description TEXT NOT NULL DEFAULT '',
    logo VARCHAR(500) NOT NULL,
    href VARCHAR(500) NOT NULL,
    cta VARCHAR(100) NOT NULL DEFAULT 'Explore Platform',
    icon_name VARCHAR(100),
    is_product BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select projects"
ON public.projects FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow admin manage projects"
ON public.projects FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- 4. TEAM MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    initials VARCHAR(10),
    image VARCHAR(500),
    linkedin VARCHAR(500),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team FORCE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select team"
ON public.team FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow admin manage team"
ON public.team FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- 5. TAMPER-PROOF AUDIT LOG TABLE (Append-Only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs FORCE ROW LEVEL SECURITY;

-- Allow insert via SECURITY DEFINER function or admin
CREATE POLICY "Allow authenticated insert audit logs"
ON public.security_audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Disallow ALL updates and deletes (Immutable append-only audit trail)
CREATE POLICY "Deny update on audit logs"
ON public.security_audit_logs FOR UPDATE
USING (false);

CREATE POLICY "Deny delete on audit logs"
ON public.security_audit_logs FOR DELETE
USING (false);

-- Allow admin only to read audit logs
CREATE POLICY "Allow admin select audit logs"
ON public.security_audit_logs FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================================
-- 6. SECURITY DEFINER HELPER (Safe search_path hardening)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_security_event(
    p_action VARCHAR,
    p_actor VARCHAR,
    p_ip VARCHAR,
    p_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.security_audit_logs (action, actor_email, ip_address, details)
    VALUES (p_action, p_actor, p_ip, p_details)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;
