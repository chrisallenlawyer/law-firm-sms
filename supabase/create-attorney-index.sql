-- PART 3: Create Attorney Index
-- Run this AFTER running both add-attorney-enum.sql and attorney-docket-enhancements.sql

-- Create index for attorney role (can only be done after enum value exists)
CREATE INDEX IF NOT EXISTS idx_staff_users_attorney_role ON staff_users(role) WHERE role = 'attorney';


