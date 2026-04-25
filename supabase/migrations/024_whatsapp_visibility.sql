-- ─────────────────────────────────────────────────────────────
-- 024 · WhatsApp public visibility flag + updated view
-- ─────────────────────────────────────────────────────────────

ALTER TABLE households
  ADD COLUMN IF NOT EXISTS directory_whatsapp_public boolean DEFAULT false;

-- Recreate view to include the new flag and website/maps columns
DROP VIEW IF EXISTS public_organizations;

CREATE VIEW public_organizations AS
  SELECT
    id,
    name,
    contact_phone,
    country,
    COALESCE(directory_city, city)               AS city,
    COALESCE(directory_description, description) AS description,
    COALESCE(directory_instagram, instagram)     AS instagram,
    COALESCE(directory_whatsapp,  whatsapp)      AS whatsapp,
    directory_whatsapp_public,
    COALESCE(directory_facebook,  facebook)      AS facebook,
    COALESCE(directory_tiktok,    tiktok)        AS tiktok,
    directory_cover_url,
    directory_website,
    directory_maps,
    directory_visible,
    created_at
  FROM households
  WHERE type = 'organization'
    AND directory_visible = true;
