-- ─────────────────────────────────────────────────────────────
-- 022 · Add website + maps to households & public_organizations view
-- ─────────────────────────────────────────────────────────────

-- 1. Add new columns to households
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS directory_website text,
  ADD COLUMN IF NOT EXISTS directory_maps    text;

-- 2. Recreate the view to include the new columns
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
    COALESCE(directory_facebook,  facebook)      AS facebook,
    COALESCE(directory_tiktok,    tiktok)        AS tiktok,
    directory_cover_url,
    directory_visible,
    directory_website,
    directory_maps,
    created_at
  FROM households
  WHERE type = 'organization'
    AND directory_visible = true;
