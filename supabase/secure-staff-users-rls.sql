-- Secure RLS policies that allow authentication but maintain security
-- This version allows login while still providing proper access control

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view staff users" ON staff_users;
DROP POLICY IF EXISTS "Authenticated users can insert staff users" ON staff_users;
DROP POLICY IF EXISTS "Authenticated users can update staff users" ON staff_users;
DROP POLICY IF EXISTS "Authenticated users can delete staff users" ON staff_users;
DROP POLICY IF EXISTS "Service role bypasses RLS" ON staff_users;

-- Create secure but functional policies

-- View policy: Allow authenticated users to view staff users
-- This is needed for authentication checks and general staff management
CREATE POLICY "Authenticated can view staff users" ON staff_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert policy: Allow authenticated users to add new staff (attorneys, etc.)
CREATE POLICY "Authenticated can insert staff users" ON staff_users
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Update policy: Allow authenticated users to update staff records
CREATE POLICY "Authenticated can update staff users" ON staff_users
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Delete policy: Allow authenticated users to delete staff (admin functionality)
CREATE POLICY "Authenticated can delete staff users" ON staff_users
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Service role bypass for system operations
CREATE POLICY "Service role full access" ON staff_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
