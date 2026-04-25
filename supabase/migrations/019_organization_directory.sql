-- ─────────────────────────────────────────────────────────────
-- 019 · Organization Directory  (v2 – unified columns)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE households
  ADD COLUMN IF NOT EXISTS directory_visible     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS directory_description text,
  ADD COLUMN IF NOT EXISTS directory_instagram   text,
  ADD COLUMN IF NOT EXISTS directory_whatsapp    text,
  ADD COLUMN IF NOT EXISTS directory_facebook    text,
  ADD COLUMN IF NOT EXISTS directory_tiktok      text,
  ADD COLUMN IF NOT EXISTS directory_cover_url   text,
  ADD COLUMN IF NOT EXISTS directory_city        text,
  ADD COLUMN IF NOT EXISTS city                  text,
  ADD COLUMN IF NOT EXISTS description           text,
  ADD COLUMN IF NOT EXISTS instagram             text,
  ADD COLUMN IF NOT EXISTS whatsapp              text,
  ADD COLUMN IF NOT EXISTS facebook              text,
  ADD COLUMN IF NOT EXISTS tiktok                text;

-- Drop old view first (PostgreSQL cannot rename view columns in place)
DROP VIEW IF EXISTS public_organizations;

-- Recreate merging directory_* (new) and non-prefixed (legacy) columns
CREATE VIEW public_organizations AS
  SELECT
    id,
    name,
    contact_phone,
    country,
    -- city: prefer directory_city (set by new createHousehold), fall back to city
    COALESCE(directory_city, city)               AS city,
    -- description
    COALESCE(directory_description, description) AS description,
    -- socials
    COALESCE(directory_instagram, instagram)     AS instagram,
    COALESCE(directory_whatsapp,  whatsapp)      AS whatsapp,
    COALESCE(directory_facebook,  facebook)      AS facebook,
    COALESCE(directory_tiktok,    tiktok)        AS tiktok,
    -- cover photo
    directory_cover_url,
    directory_visible,
    created_at
  FROM households
  WHERE type = 'organization'
    AND directory_visible = true;
