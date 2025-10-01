-- Storage policies for media-files bucket
-- This script sets up Row Level Security for the media-files storage bucket
-- Note: These policies are created through Supabase's storage interface, not direct SQL

-- IMPORTANT: Run these policies through the Supabase Dashboard:
-- 1. Go to Storage → media-files bucket → Policies
-- 2. Create each policy individually using the Supabase interface

-- Alternative: Use Supabase CLI or Dashboard to create these policies:

-- Policy 1: Allow staff to upload media files
-- Name: "Allow staff to upload media files"
-- Target roles: authenticated
-- USING expression: bucket_id = 'media-files'
-- WITH CHECK expression: 
--   EXISTS (
--     SELECT 1 FROM staff_users 
--     WHERE staff_users.email = auth.jwt() ->> 'email'
--     AND staff_users.role IN ('admin', 'staff', 'attorney')
--   )

-- Policy 2: Allow staff to view media files  
-- Name: "Allow staff to view media files"
-- Target roles: authenticated
-- USING expression:
--   bucket_id = 'media-files' AND
--   EXISTS (
--     SELECT 1 FROM staff_users 
--     WHERE staff_users.email = auth.jwt() ->> 'email'
--     AND staff_users.role IN ('admin', 'staff', 'attorney')
--   )

-- Policy 3: Allow staff to update media files
-- Name: "Allow staff to update media files"  
-- Target roles: authenticated
-- USING expression:
--   bucket_id = 'media-files' AND
--   EXISTS (
--     SELECT 1 FROM staff_users 
--     WHERE staff_users.email = auth.jwt() ->> 'email'
--     AND staff_users.role IN ('admin', 'staff', 'attorney')
--   )

-- Policy 4: Allow staff to delete media files
-- Name: "Allow staff to delete media files"
-- Target roles: authenticated  
-- USING expression:
--   bucket_id = 'media-files' AND
--   EXISTS (
--     SELECT 1 FROM staff_users 
--     WHERE staff_users.email = auth.jwt() ->> 'email'
--     AND staff_users.role IN ('admin', 'staff', 'attorney')
--   )

-- Note: Since we can't modify storage.objects directly, 
-- create these policies through the Supabase Dashboard Storage interface
