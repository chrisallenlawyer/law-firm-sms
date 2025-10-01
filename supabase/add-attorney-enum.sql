-- PART 1: Add Attorney Role to Enum
-- Run this FIRST, then run attorney-docket-enhancements.sql

-- Add 'attorney' role to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'attorney';


