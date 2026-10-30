-- ============================================================================
-- Paid Client Access Integration & Portal
-- Supabase PostgreSQL Row Level Security (RLS) & Tenant Isolation Policies
-- ============================================================================

-- 1. Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoho_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 2. Revoke direct write access from browser roles (anon & authenticated)
-- Only the backend service_role / postgres connection can INSERT/UPDATE/DELETE
REVOKE ALL ON public.users FROM anon, authenticated;
REVOKE ALL ON public.documents FROM anon, authenticated;
REVOKE ALL ON public.document_contents FROM anon, authenticated;
REVOKE ALL ON public.purchases FROM anon, authenticated;
REVOKE ALL ON public.zoho_sync_logs FROM anon, authenticated;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;

-- Grant strictly SELECT to authenticated users on client-facing tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.documents TO authenticated;
GRANT SELECT ON public.document_contents TO authenticated;
GRANT SELECT ON public.purchases TO authenticated;
GRANT SELECT ON public.zoho_sync_logs TO authenticated;

-- 3. Drop existing policies if re-running setup
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "documents_select_catalog" ON public.documents;
DROP POLICY IF EXISTS "purchases_select_own" ON public.purchases;
DROP POLICY IF EXISTS "zoho_sync_logs_select_own" ON public.zoho_sync_logs;
DROP POLICY IF EXISTS "document_contents_select_paid_only" ON public.document_contents;

-- 4. Create strict tenant-isolation SELECT policies

-- Users can only read their own user profile and mapped Zoho Deal ID
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Clients can only see public catalog documents or documents specifically assigned to them
-- One client CANNOT see another client's assigned document metadata
CREATE POLICY "documents_select_catalog"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (owner_id IS NULL OR owner_id = auth.uid());

-- Clients can only read their own purchase entitlements
-- One client CANNOT retrieve another client's purchase record
CREATE POLICY "purchases_select_own"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Clients can only read their own Zoho CRM sync logs
CREATE POLICY "zoho_sync_logs_select_own"
  ON public.zoho_sync_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Confidential Document Content is strictly locked behind a verified PAID purchase
-- belonging to auth.uid() AND matching the document's owner constraint
CREATE POLICY "document_contents_select_paid_only"
  ON public.document_contents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.purchases p
      JOIN public.documents d ON d.id = p.document_id
      WHERE p.document_id = public.document_contents.document_id
        AND p.user_id = auth.uid()
        AND p.status = 'PAID'
        AND (d.owner_id IS NULL OR d.owner_id = auth.uid())
    )
  );

-- Note: webhook_events has NO policies for anon/authenticated (strictly server-only).
