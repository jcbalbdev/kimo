-- ─────────────────────────────────────────────────────────────
-- 021 · Pet Photo URL + Storage Bucket
-- 1. Add photo_url column to pets
-- 2. Create pet-photos bucket (public, image-only, 2 MB)
-- 3. RLS policies for upload / read
-- ─────────────────────────────────────────────────────────────

-- 1. New column for storing the real pet photo URL
ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT NULL;

-- 2. Storage bucket for pet photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-photos',
  'pet-photos',
  true,
  2097152,   -- 2 MB max (already compressed client-side to 400×400 WebP)
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload pet photos
CREATE POLICY "Pet owners can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pet-photos');

-- Allow authenticated users to replace/update pet photos
CREATE POLICY "Pet owners can update photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pet-photos');

-- Allow public read (bucket is public, explicit for clarity)
CREATE POLICY "Public can read pet photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'pet-photos');
