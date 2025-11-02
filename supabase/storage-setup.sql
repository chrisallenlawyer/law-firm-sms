-- Storage Setup for Site Images
-- This file sets up the storage bucket and policies for site image uploads

-- Create the storage bucket for site images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images',
  'site-images',
  true, -- Make bucket public so images can be accessed
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload site images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-images' AND
  (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'staff')
);

-- Policy: Allow public to view/download files (since bucket is public)
CREATE POLICY "Public can view site images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'site-images');

-- Policy: Allow authenticated staff/admin to update files
CREATE POLICY "Authenticated users can update site images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-images' AND
  (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'staff')
)
WITH CHECK (
  bucket_id = 'site-images' AND
  (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'staff')
);

-- Policy: Allow authenticated staff/admin to delete files
CREATE POLICY "Authenticated users can delete site images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-images' AND
  (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'staff')
);

-- Note: If you get policy conflicts, you may need to drop existing policies first:
-- DROP POLICY IF EXISTS "Authenticated users can upload site images" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can view site images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can update site images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can delete site images" ON storage.objects;

-- Verify setup
-- Run these to check:
-- SELECT * FROM storage.buckets WHERE id = 'site-images';
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

