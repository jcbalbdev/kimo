-- ─────────────────────────────────────────────────────────────
-- 020 · Org Covers Storage + Public Pet RLS
-- 1. Create the 'org-covers' bucket (public, image-only)
-- 2. Allow public read of pets from directory-visible orgs
-- ─────────────────────────────────────────────────────────────

-- 1. Storage bucket for org cover photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-covers',
  'org-covers',
  true,
  2097152,   -- 2 MB max (already compressed client-side)
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own org folder
CREATE POLICY "Org owners can upload covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'org-covers');

-- Allow authenticated users to update/replace their cover
CREATE POLICY "Org owners can update covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'org-covers');

-- Allow public read (the bucket is public, but this makes it explicit)
CREATE POLICY "Public can read org covers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'org-covers');

-- 2. RLS: allow anyone to read pets that belong to a directory-visible org
CREATE POLICY "Public read pets from visible orgs"
  ON pets FOR SELECT
  TO public
  USING (
    household_id IN (
      SELECT id FROM households
      WHERE type = 'organization'
        AND directory_visible = true
    )
  );
