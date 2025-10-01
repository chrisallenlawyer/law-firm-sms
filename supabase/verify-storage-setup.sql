-- Verification script for storage setup
-- Run this to verify your storage bucket and policies are set up correctly

-- Check if the media-files bucket exists
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'media-files';

-- Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test if RLS is enabled on storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Expected results:
-- 1. Bucket should exist with name 'media-files'
-- 2. Should have 4 policies (upload, view, update, delete)
-- 3. RLS should be enabled (rowsecurity = true)
