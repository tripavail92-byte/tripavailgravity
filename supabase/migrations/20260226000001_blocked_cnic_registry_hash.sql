-- Governance upgrade: hashed CNIC block registry (enterprise control)
-- Stores a SHA-256 hash of the normalized CNIC (plus optional pepper in application layer)
-- so we can block CNICs without storing them in cleartext.

BEGIN;

CREATE TABLE IF NOT EXISTS public.blocked_cnic_registry (
  cnic_hash text PRIMARY KEY,
  reason text,
  blocked_at timestamptz NOT NULL DEFAULT now(),
  blocked_by_admin_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.blocked_cnic_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage blocked cnic registry" ON public.blocked_cnic_registry;
CREATE POLICY "Admin can manage blocked cnic registry"
  ON public.blocked_cnic_registry
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMIT;
