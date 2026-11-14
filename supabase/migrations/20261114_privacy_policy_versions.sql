BEGIN;

-- Ensure required cryptographic and UUID extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure admin_credentials table exists
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    passcode_hash TEXT NOT NULL,
    passcode_salt TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.admin_credentials
    ADD COLUMN IF NOT EXISTS passcode_salt text;

-- Ensure security_audit_logs table exists
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.verify_admin_passcode(
    p_email varchar,
    p_passcode varchar
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_stored_hash text;
    v_stored_salt text;
    v_locked_until timestamptz;
    v_is_active boolean;
    v_is_match boolean := false;
BEGIN
    SELECT passcode_hash, passcode_salt, locked_until, is_active
    INTO v_stored_hash, v_stored_salt, v_locked_until, v_is_active
    FROM public.admin_credentials
    WHERE email = lower(trim(p_email))
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_active THEN
        RETURN false;
    END IF;

    IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
        RETURN false;
    END IF;

    IF v_stored_salt IS NOT NULL THEN
        RETURN false;
    ELSIF v_stored_hash LIKE '$2%' THEN
        v_is_match := v_stored_hash = crypt(p_passcode, v_stored_hash);
    ELSIF v_stored_hash ~ '^[0-9A-Fa-f]{64}$' THEN
        v_is_match := lower(v_stored_hash) = encode(digest(p_passcode, 'sha256'), 'hex');
    ELSE
        v_is_match := v_stored_hash = p_passcode;
    END IF;

    IF v_is_match THEN
        UPDATE public.admin_credentials
        SET passcode_hash = crypt(p_passcode, gen_salt('bf', 12)),
            passcode_salt = NULL,
            failed_login_attempts = 0,
            last_login_at = now()
        WHERE email = lower(trim(p_email));
        RETURN true;
    ELSE
        UPDATE public.admin_credentials
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE
                WHEN failed_login_attempts + 1 >= 5 THEN now() + interval '15 minutes'
                ELSE locked_until
            END
        WHERE email = lower(trim(p_email));
        RETURN false;
    END IF;
END;
$$;

CREATE TABLE public.privacy_policy_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL DEFAULT 'Privacy Policy',
    current_version_id uuid,
    created_by text,
    updated_by text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT privacy_policy_documents_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE public.privacy_policy_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES public.privacy_policy_documents(id) ON DELETE RESTRICT,
    version_number integer NOT NULL CHECK (version_number > 0),
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived')),
    title text NOT NULL,
    summary text NOT NULL DEFAULT '',
    content text NOT NULL,
    created_by text NOT NULL,
    updated_by text NOT NULL,
    published_by text,
    published_at timestamptz,
    restored_from_version_id uuid REFERENCES public.privacy_policy_versions(id) ON DELETE RESTRICT,
    legacy_version_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT privacy_policy_versions_document_number_unique UNIQUE (document_id, version_number),
    CONSTRAINT privacy_policy_versions_document_id_unique UNIQUE (document_id, id),
    CONSTRAINT privacy_policy_versions_legacy_id_unique UNIQUE (document_id, legacy_version_id),
    CONSTRAINT privacy_policy_versions_publisher_check
        CHECK (status <> 'published' OR (published_by IS NOT NULL AND published_at IS NOT NULL))
);

ALTER TABLE public.privacy_policy_documents
    ADD CONSTRAINT privacy_policy_documents_current_version_fk
    FOREIGN KEY (id, current_version_id)
    REFERENCES public.privacy_policy_versions(document_id, id)
    ON DELETE RESTRICT
    DEFERRABLE INITIALLY DEFERRED;

CREATE UNIQUE INDEX privacy_policy_versions_one_published_per_document
    ON public.privacy_policy_versions(document_id)
    WHERE status = 'published';

CREATE INDEX privacy_policy_versions_document_status_number_idx
    ON public.privacy_policy_versions(document_id, status, version_number DESC);

CREATE INDEX privacy_policy_versions_published_at_idx
    ON public.privacy_policy_versions(document_id, published_at DESC)
    WHERE published_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_privacy_policy_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER privacy_policy_documents_set_updated_at
    BEFORE UPDATE ON public.privacy_policy_documents
    FOR EACH ROW EXECUTE FUNCTION public.set_privacy_policy_updated_at();

CREATE TRIGGER privacy_policy_versions_set_updated_at
    BEFORE UPDATE ON public.privacy_policy_versions
    FOR EACH ROW EXECUTE FUNCTION public.set_privacy_policy_updated_at();

CREATE OR REPLACE FUNCTION public.is_current_published_privacy_policy(
    p_document_id uuid,
    p_version_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.privacy_policy_documents AS d
        JOIN public.privacy_policy_versions AS v
          ON v.document_id = d.id
         AND v.id = d.current_version_id
        WHERE d.id = p_document_id
          AND d.current_version_id = p_version_id
          AND v.status = 'published'
    );
$$;

CREATE OR REPLACE FUNCTION public.enforce_current_published_privacy_policy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW.current_version_id IS NOT NULL
       AND NOT public.is_current_published_privacy_policy(NEW.id, NEW.current_version_id) THEN
        RAISE EXCEPTION 'current_version_id must reference the document''s published version';
    END IF;
    RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER privacy_policy_current_version_is_published
    AFTER INSERT OR UPDATE ON public.privacy_policy_documents
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public.enforce_current_published_privacy_policy();

ALTER TABLE public.privacy_policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_policy_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_policy_versions FORCE ROW LEVEL SECURITY;

CREATE POLICY privacy_policy_public_current_document
    ON public.privacy_policy_documents
    FOR SELECT
    TO anon, authenticated
    USING (
        slug = 'privacy-policy'
        AND current_version_id IS NOT NULL
        AND public.is_current_published_privacy_policy(id, current_version_id)
    );

CREATE POLICY privacy_policy_public_current_version
    ON public.privacy_policy_versions
    FOR SELECT
    TO anon, authenticated
    USING (
        status = 'published'
        AND public.is_current_published_privacy_policy(document_id, id)
    );

REVOKE ALL ON public.privacy_policy_documents FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.privacy_policy_versions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.privacy_policy_documents, public.privacy_policy_versions TO anon, authenticated;
GRANT ALL ON public.privacy_policy_documents, public.privacy_policy_versions TO service_role;

REVOKE ALL ON FUNCTION public.is_current_published_privacy_policy(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_published_privacy_policy(uuid, uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.save_privacy_policy_draft(
    p_title text,
    p_summary text,
    p_content text,
    p_actor text,
    p_ip_address text,
    p_version_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_document_id uuid;
    v_version_id uuid;
    v_version_number integer;
    v_action text;
BEGIN
    IF p_actor IS NULL OR length(trim(p_actor)) = 0
       OR p_title IS NULL OR length(trim(p_title)) = 0 OR length(p_title) > 200
       OR p_summary IS NULL OR length(p_summary) > 500
       OR p_content IS NULL OR length(trim(p_content)) = 0 OR length(p_content) > 20000 THEN
        RAISE EXCEPTION 'Invalid privacy policy draft input';
    END IF;

    SELECT id INTO v_document_id
    FROM public.privacy_policy_documents
    WHERE slug = 'privacy-policy'
    FOR UPDATE;

    IF v_document_id IS NULL THEN
        RAISE EXCEPTION 'Privacy policy document is not initialized';
    END IF;

    IF p_version_id IS NULL THEN
        SELECT COALESCE(max(version_number), 0) + 1
        INTO v_version_number
        FROM public.privacy_policy_versions
        WHERE document_id = v_document_id;

        INSERT INTO public.privacy_policy_versions (
            document_id, version_number, title, summary, content, created_by, updated_by
        )
        VALUES (
            v_document_id, v_version_number, trim(p_title), p_summary, p_content, trim(p_actor), trim(p_actor)
        )
        RETURNING id INTO v_version_id;

        v_action := 'privacy_policy_draft_created';
    ELSE
        UPDATE public.privacy_policy_versions
        SET title = trim(p_title),
            summary = p_summary,
            content = p_content,
            updated_by = trim(p_actor)
        WHERE id = p_version_id
          AND document_id = v_document_id
          AND status = 'draft'
        RETURNING id INTO v_version_id;

        IF v_version_id IS NULL THEN
            RAISE EXCEPTION 'Only an existing draft can be updated';
        END IF;

        v_action := 'privacy_policy_draft_updated';
    END IF;

    UPDATE public.privacy_policy_documents
    SET updated_by = trim(p_actor)
    WHERE id = v_document_id;

    INSERT INTO public.security_audit_logs (action, actor_email, ip_address, details)
    VALUES (
        v_action,
        trim(p_actor),
        left(COALESCE(NULLIF(p_ip_address, ''), 'unknown'), 45),
        jsonb_build_object('document_id', v_document_id, 'version_id', v_version_id)
    );

    RETURN v_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_privacy_policy_version(
    p_version_id uuid,
    p_actor text,
    p_ip_address text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_document_id uuid;
BEGIN
    IF p_actor IS NULL OR length(trim(p_actor)) = 0 THEN
        RAISE EXCEPTION 'Publisher identity is required';
    END IF;

    SELECT document_id INTO v_document_id
    FROM public.privacy_policy_versions
    WHERE id = p_version_id;

    IF v_document_id IS NULL THEN
        RAISE EXCEPTION 'Privacy policy version was not found';
    END IF;

    PERFORM 1
    FROM public.privacy_policy_documents
    WHERE id = v_document_id
    FOR UPDATE;

    PERFORM 1
    FROM public.privacy_policy_versions
    WHERE id = p_version_id
      AND document_id = v_document_id
      AND status = 'draft'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only a draft privacy policy version can be published';
    END IF;

    UPDATE public.privacy_policy_versions
    SET status = 'archived',
        updated_by = trim(p_actor)
    WHERE document_id = v_document_id
      AND status = 'published';

    UPDATE public.privacy_policy_versions
    SET status = 'published',
        published_by = trim(p_actor),
        published_at = now(),
        updated_by = trim(p_actor)
    WHERE id = p_version_id;

    UPDATE public.privacy_policy_documents
    SET title = (SELECT title FROM public.privacy_policy_versions WHERE id = p_version_id),
        current_version_id = p_version_id,
        updated_by = trim(p_actor)
    WHERE id = v_document_id;

    INSERT INTO public.security_audit_logs (action, actor_email, ip_address, details)
    VALUES (
        'privacy_policy_published',
        trim(p_actor),
        left(COALESCE(NULLIF(p_ip_address, ''), 'unknown'), 45),
        jsonb_build_object('document_id', v_document_id, 'version_id', p_version_id)
    );

    RETURN p_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_privacy_policy_version(
    p_version_id uuid,
    p_actor text,
    p_ip_address text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_document_id uuid;
    v_version_number integer;
    v_restored_version_id uuid;
    v_source public.privacy_policy_versions%ROWTYPE;
BEGIN
    IF p_actor IS NULL OR length(trim(p_actor)) = 0 THEN
        RAISE EXCEPTION 'Restoring administrator identity is required';
    END IF;

    SELECT document_id INTO v_document_id
    FROM public.privacy_policy_versions
    WHERE id = p_version_id;

    IF v_document_id IS NULL THEN
        RAISE EXCEPTION 'Privacy policy version was not found';
    END IF;

    PERFORM 1
    FROM public.privacy_policy_documents
    WHERE id = v_document_id
    FOR UPDATE;

    SELECT * INTO v_source
    FROM public.privacy_policy_versions
    WHERE id = p_version_id
      AND document_id = v_document_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Privacy policy version was not found';
    END IF;

    SELECT COALESCE(max(version_number), 0) + 1
    INTO v_version_number
    FROM public.privacy_policy_versions
    WHERE document_id = v_document_id;

    INSERT INTO public.privacy_policy_versions (
        document_id, version_number, status, title, summary, content,
        created_by, updated_by, restored_from_version_id
    )
    VALUES (
        v_document_id, v_version_number, 'draft', v_source.title, v_source.summary, v_source.content,
        trim(p_actor), trim(p_actor), v_source.id
    )
    RETURNING id INTO v_restored_version_id;

    UPDATE public.privacy_policy_documents
    SET updated_by = trim(p_actor)
    WHERE id = v_document_id;

    INSERT INTO public.security_audit_logs (action, actor_email, ip_address, details)
    VALUES (
        'privacy_policy_restored',
        trim(p_actor),
        left(COALESCE(NULLIF(p_ip_address, ''), 'unknown'), 45),
        jsonb_build_object(
            'document_id', v_document_id,
            'version_id', v_restored_version_id,
            'restored_from_version_id', p_version_id
        )
    );

    RETURN v_restored_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_legacy_privacy_policy(
    p_payload jsonb,
    p_actor text,
    p_ip_address text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_document_id uuid;
    v_source_count integer;
    v_existing_count integer;
    v_current_source_id text;
    v_version jsonb;
    v_ordinal bigint;
    v_legacy_id text;
    v_source_status text;
    v_status text;
    v_version_id uuid;
    v_version_number integer;
    v_imported integer := 0;
BEGIN
    IF p_actor IS NULL OR length(trim(p_actor)) = 0
       OR jsonb_typeof(p_payload->'versions') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'A legacy policy document with a versions array is required';
    END IF;

    v_source_count := jsonb_array_length(p_payload->'versions');
    IF v_source_count = 0 THEN
        RAISE EXCEPTION 'No legacy policy versions were provided';
    END IF;

    INSERT INTO public.privacy_policy_documents (slug, title, created_by, updated_by)
    VALUES ('privacy-policy', 'Privacy Policy', trim(p_actor), trim(p_actor))
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO v_document_id
    FROM public.privacy_policy_documents
    WHERE slug = 'privacy-policy'
    FOR UPDATE;

    SELECT count(*) INTO v_existing_count
    FROM public.privacy_policy_versions
    WHERE document_id = v_document_id;

    IF v_existing_count > 0 THEN
        SELECT count(*) INTO v_existing_count
        FROM jsonb_array_elements(p_payload->'versions') WITH ORDINALITY AS source(item, ordinality)
        WHERE EXISTS (
            SELECT 1
            FROM public.privacy_policy_versions AS existing
            WHERE existing.document_id = v_document_id
              AND existing.legacy_version_id = COALESCE(
                  NULLIF(source.item->>'id', ''),
                  'legacy-' || source.ordinality::text
              )
        );

        IF v_existing_count = v_source_count THEN
            RETURN v_document_id;
        END IF;

        RAISE EXCEPTION 'Privacy policy already contains versions; refusing a partial or duplicate import';
    END IF;

    v_current_source_id := NULLIF(p_payload->>'currentVersionId', '');
    IF v_current_source_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_payload->'versions') WITH ORDINALITY AS source(item, ordinality)
        WHERE COALESCE(NULLIF(source.item->>'id', ''), 'legacy-' || source.ordinality::text) = v_current_source_id
          AND source.item->>'status' = 'published'
    ) THEN
        SELECT COALESCE(NULLIF(source.item->>'id', ''), 'legacy-' || source.ordinality::text)
        INTO v_current_source_id
        FROM jsonb_array_elements(p_payload->'versions') WITH ORDINALITY AS source(item, ordinality)
        WHERE source.item->>'status' = 'published'
        ORDER BY source.ordinality DESC
        LIMIT 1;
    END IF;

    SELECT COALESCE(max(version_number), 0)
    INTO v_version_number
    FROM public.privacy_policy_versions
    WHERE document_id = v_document_id;

    FOR v_version, v_ordinal IN
        SELECT item, ordinality
        FROM jsonb_array_elements(p_payload->'versions') WITH ORDINALITY AS source(item, ordinality)
        ORDER BY source.ordinality
    LOOP
        v_version_number := v_version_number + 1;
        v_legacy_id := COALESCE(
            NULLIF(v_version->>'id', ''),
            'legacy-' || v_ordinal::text
        );
        v_source_status := v_version->>'status';
        v_status := CASE
            WHEN v_legacy_id = v_current_source_id AND v_source_status = 'published' THEN 'published'
            WHEN v_source_status IN ('published', 'archived') THEN 'archived'
            ELSE 'draft'
        END;

        INSERT INTO public.privacy_policy_versions (
            document_id, version_number, status, title, summary, content,
            created_by, updated_by, published_by, published_at, legacy_version_id,
            created_at, updated_at
        )
        VALUES (
            v_document_id,
            v_version_number,
            v_status,
            COALESCE(NULLIF(v_version->>'title', ''), 'Privacy Policy'),
            COALESCE(v_version->>'summary', ''),
            COALESCE(v_version->>'content', ''),
            COALESCE(NULLIF(v_version->>'author', ''), trim(p_actor)),
            COALESCE(NULLIF(v_version->>'author', ''), trim(p_actor)),
            CASE
                WHEN v_source_status = 'published' THEN COALESCE(NULLIF(v_version->>'author', ''), trim(p_actor))
                WHEN v_source_status = 'archived' AND NULLIF(v_version->>'publishedAt', '') IS NOT NULL
                    THEN COALESCE(NULLIF(v_version->>'author', ''), trim(p_actor))
                ELSE NULL
            END,
            CASE
                WHEN v_source_status = 'published'
                    THEN COALESCE(NULLIF(v_version->>'publishedAt', '')::timestamptz, NULLIF(v_version->>'createdAt', '')::timestamptz, now())
                WHEN v_source_status = 'archived' AND NULLIF(v_version->>'publishedAt', '') IS NOT NULL
                    THEN NULLIF(v_version->>'publishedAt', '')::timestamptz
                ELSE NULL
            END,
            v_legacy_id,
            COALESCE(NULLIF(v_version->>'createdAt', '')::timestamptz, now()),
            COALESCE(NULLIF(v_version->>'updatedAt', '')::timestamptz, NULLIF(v_version->>'createdAt', '')::timestamptz, now())
        )
        RETURNING id INTO v_version_id;

        IF v_status = 'published' THEN
            UPDATE public.privacy_policy_documents
            SET title = COALESCE(NULLIF(v_version->>'title', ''), 'Privacy Policy'),
                current_version_id = v_version_id,
                updated_by = trim(p_actor),
                updated_at = COALESCE(NULLIF(p_payload->>'updatedAt', '')::timestamptz, now())
            WHERE id = v_document_id;
        END IF;

        v_imported := v_imported + 1;
    END LOOP;

    INSERT INTO public.security_audit_logs (action, actor_email, ip_address, details)
    VALUES (
        'privacy_policy_legacy_imported',
        trim(p_actor),
        left(COALESCE(NULLIF(p_ip_address, ''), 'unknown'), 45),
        jsonb_build_object('document_id', v_document_id, 'version_count', v_imported)
    );

    RETURN v_document_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_privacy_policy_draft(text, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.publish_privacy_policy_version(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.restore_privacy_policy_version(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.import_legacy_privacy_policy(jsonb, text, text) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.verify_admin_passcode(varchar, varchar) SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.verify_admin_passcode(varchar, varchar) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.save_privacy_policy_draft(text, text, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_privacy_policy_version(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_privacy_policy_version(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_legacy_privacy_policy(jsonb, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_passcode(varchar, varchar) TO service_role;

INSERT INTO public.privacy_policy_documents (slug, title)
VALUES ('privacy-policy', 'Privacy Policy')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
