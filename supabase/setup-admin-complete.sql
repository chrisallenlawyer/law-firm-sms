-- Complete Admin Setup Script
-- This script helps you set up your first admin user

-- Step 1: Check existing staff users
SELECT 'Current staff users:' as info;
SELECT id, email, name, role, is_active, created_at FROM staff_users ORDER BY created_at;

-- Step 2: Check if you have any Supabase auth users
SELECT 'Auth users (if accessible):' as info;
-- Note: You may not be able to see auth.users directly depending on your permissions

-- Step 3: Create admin user (MODIFY THE EMAIL AND NAME BELOW)
-- IMPORTANT: Replace 'admin@yourdomain.com' with your actual email address
-- IMPORTANT: Replace 'Admin User' with your actual name

INSERT INTO staff_users (email, name, role, is_active) 
VALUES (
  'admin@yourdomain.com',  -- CHANGE THIS TO YOUR EMAIL
  'Admin User',            -- CHANGE THIS TO YOUR NAME
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Step 4: Verify the admin user was created
SELECT 'Admin user created/updated:' as info;
SELECT id, email, name, role, is_active FROM staff_users WHERE role = 'admin';

-- Step 5: Instructions for Supabase Auth
SELECT 'NEXT STEPS:' as info;
SELECT '1. Go to Supabase Dashboard > Authentication > Users' as step;
SELECT '2. Click "Add User" and create a user with the same email as above' as step;
SELECT '3. Set a password for this user' as step;
SELECT '4. Try logging in with the email and password you just created' as step;
