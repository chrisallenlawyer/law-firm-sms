-- Fix RLS policies for media_files table to use email-based authentication
-- This matches the authentication pattern used in the API routes

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view all media files" ON media_files;
DROP POLICY IF EXISTS "Staff can insert media files" ON media_files;
DROP POLICY IF EXISTS "Staff can update media files" ON media_files;
DROP POLICY IF EXISTS "Staff can delete media files" ON media_files;

-- Policy: Staff, attorneys, and admins can view all media files
-- Using email-based authentication to match API route pattern
CREATE POLICY "Staff can view all media files" ON media_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.email = auth.jwt() ->> 'email'
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  );

-- Policy: Staff, attorneys, and admins can insert media files
CREATE POLICY "Staff can insert media files" ON media_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.email = auth.jwt() ->> 'email'
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  );

-- Policy: Staff, attorneys, and admins can update media files
CREATE POLICY "Staff can update media files" ON media_files
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.email = auth.jwt() ->> 'email'
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.email = auth.jwt() ->> 'email'
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  );

-- Policy: Staff, attorneys, and admins can delete media files
CREATE POLICY "Staff can delete media files" ON media_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.email = auth.jwt() ->> 'email'
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  );
