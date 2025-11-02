-- Simplified Storage Setup for Site Images
-- Run this in Supabase SQL Editor to create the bucket only

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

-- Note: You'll need to set up RLS policies through the Supabase Dashboard UI
-- See STORAGE-POLICIES-MANUAL-SETUP.md for instructions

