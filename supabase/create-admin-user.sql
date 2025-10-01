-- Create Admin User Script
-- Run this to create your first admin user

-- First, let's check if there are any existing staff users
SELECT id, email, name, role, is_active FROM staff_users;

-- If you need to create an admin user, uncomment and modify the following:
-- Replace 'your-email@domain.com' with your actual email address
-- Replace 'Your Name' with your actual name

INSERT INTO staff_users (email, name, role, is_active) 
VALUES (
  'your-email@domain.com',  -- Replace with your email
  'Your Name',              -- Replace with your name
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- After running this, you should be able to login with your email
-- The system will use this email for authentication


