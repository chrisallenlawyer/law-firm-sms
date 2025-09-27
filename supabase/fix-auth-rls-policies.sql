-- Fix RLS policies that are blocking authentication
-- The previous policies created a circular dependency that prevented login

-- Drop the problematic policies
DROP POLICY IF EXISTS "Staff and admin can view all staff users" ON staff_users;
DROP POLICY IF EXISTS "Staff and admin can insert staff users" ON staff_users;
DROP POLICY IF EXISTS "Staff and admin can update staff users" ON staff_users;
DROP POLICY IF EXISTS "Admin can delete staff users" ON staff_users;
DROP POLICY IF EXISTS "Service role can manage all staff users" ON staff_users;

-- Create authentication-friendly policies
-- Allow authenticated users to view their own record and all staff users
CREATE POLICY "Authenticated users can view staff users" ON staff_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert new staff users (for adding attorneys)
CREATE POLICY "Authenticated users can insert staff users" ON staff_users
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update staff users
CREATE POLICY "Authenticated users can update staff users" ON staff_users
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete staff users (admin functionality)
CREATE POLICY "Authenticated users can delete staff users" ON staff_users
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Ensure service role can bypass RLS for system operations
CREATE POLICY "Service role bypasses RLS" ON staff_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
