-- Fix RLS policies for staff_users table
-- This allows staff and admin users to add attorneys and manage staff users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Staff users can view all staff users" ON staff_users;
DROP POLICY IF EXISTS "Staff users can insert staff users" ON staff_users;
DROP POLICY IF EXISTS "Staff users can update staff users" ON staff_users;
DROP POLICY IF EXISTS "Staff users can delete staff users" ON staff_users;

-- Create new policies that allow staff and admin to manage staff_users
-- View policy - staff and admin can view all staff users
CREATE POLICY "Staff and admin can view all staff users" ON staff_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users su
      WHERE su.id = auth.uid()::text::uuid
      AND su.role IN ('staff', 'admin')
    )
  );

-- Insert policy - staff and admin can add new staff users (including attorneys)
CREATE POLICY "Staff and admin can insert staff users" ON staff_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users su
      WHERE su.id = auth.uid()::text::uuid
      AND su.role IN ('staff', 'admin')
    )
  );

-- Update policy - staff and admin can update staff users
CREATE POLICY "Staff and admin can update staff users" ON staff_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_users su
      WHERE su.id = auth.uid()::text::uuid
      AND su.role IN ('staff', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users su
      WHERE su.id = auth.uid()::text::uuid
      AND su.role IN ('staff', 'admin')
    )
  );

-- Delete policy - only admin can delete staff users
CREATE POLICY "Admin can delete staff users" ON staff_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_users su
      WHERE su.id = auth.uid()::text::uuid
      AND su.role = 'admin'
    )
  );

-- Also ensure RLS is enabled on the table
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Create a more permissive policy for service role operations
-- This allows the service role to bypass RLS when needed
CREATE POLICY "Service role can manage all staff users" ON staff_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


