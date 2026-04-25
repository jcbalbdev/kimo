-- ─────────────────────────────────────────────────────────────
-- 026 · Restrict public_organizations view to authenticated users only
-- ─────────────────────────────────────────────────────────────

-- Revoke access from anonymous (unauthenticated) users
REVOKE SELECT ON public_organizations FROM anon;

-- Ensure only authenticated users can query the directory
GRANT SELECT ON public_organizations TO authenticated;
