-- Create Your First Admin User
-- Follow these steps exactly:

-- STEP 1: Create admin user in staff_users table
-- IMPORTANT: Change 'admin@yourdomain.com' to your actual email address
-- IMPORTANT: Change 'Your Name' to your actual name

INSERT INTO staff_users (email, name, role, is_active) 
VALUES (
  'admin@yourdomain.com',  -- CHANGE THIS TO YOUR EMAIL
  'Your Name',             -- CHANGE THIS TO YOUR NAME  
  'admin',
  true
);

-- STEP 2: Verify the user was created
SELECT id, email, name, role, is_active FROM staff_users WHERE email = 'admin@yourdomain.com';


