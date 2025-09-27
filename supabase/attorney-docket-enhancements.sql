-- Attorney and Docket Enhancements Database Schema
-- This file contains all the updates needed for attorney management and docket reporting

-- IMPORTANT: Run this script in TWO PARTS due to PostgreSQL enum limitations
-- PART 1: First run this line separately, then run the rest of the script
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'attorney';

-- PART 2: Run the rest of this script after PART 1 is committed
-- (The enum value has already been added, so we can proceed with the rest)

-- Add new fields to clients table for docket reporting
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS charge VARCHAR(255),
ADD COLUMN IF NOT EXISTS priors TEXT,
ADD COLUMN IF NOT EXISTS jail_bond VARCHAR(255),
ADD COLUMN IF NOT EXISTS discovery_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tox_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS da_offer TEXT,
ADD COLUMN IF NOT EXISTS court_action TEXT;

-- Create docket_attorneys table for primary/secondary attorney assignments per docket
CREATE TABLE IF NOT EXISTS docket_attorneys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  docket_id UUID REFERENCES dockets(id) ON DELETE CASCADE,
  client_docket_assignment_id UUID REFERENCES client_docket_assignments(id) ON DELETE CASCADE,
  attorney_id UUID REFERENCES staff_users(id) ON DELETE CASCADE,
  attorney_role VARCHAR(20) NOT NULL CHECK (attorney_role IN ('primary', 'secondary')),
  notes TEXT,
  assigned_by UUID REFERENCES staff_users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(docket_id, client_docket_assignment_id, attorney_role)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_charge ON clients(charge);
CREATE INDEX IF NOT EXISTS idx_docket_attorneys_docket ON docket_attorneys(docket_id);
CREATE INDEX IF NOT EXISTS idx_docket_attorneys_client_assignment ON docket_attorneys(client_docket_assignment_id);
CREATE INDEX IF NOT EXISTS idx_docket_attorneys_attorney ON docket_attorneys(attorney_id);
CREATE INDEX IF NOT EXISTS idx_docket_attorneys_role ON docket_attorneys(attorney_role);
-- Note: This index will be created after the enum value is added
-- CREATE INDEX IF NOT EXISTS idx_staff_users_attorney_role ON staff_users(role) WHERE role = 'attorney';

-- Add updated_at trigger for docket_attorneys
DROP TRIGGER IF EXISTS update_docket_attorneys_updated_at ON docket_attorneys;
CREATE TRIGGER update_docket_attorneys_updated_at 
  BEFORE UPDATE ON docket_attorneys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for docket client reports with all necessary information
CREATE OR REPLACE VIEW docket_client_report AS
SELECT 
  d.id as docket_id,
  d.docket_date,
  d.docket_time,
  d.judge_name,
  d.docket_type,
  c.id as client_id,
  c.last_name,
  c.first_name,
  c.case_number,
  c.charge,
  c.priors,
  c.jail_bond,
  c.discovery_received,
  c.tox_received,
  c.da_offer,
  c.court_action,
  cda.notes as assignment_notes,
  -- Client's assigned attorney
  sa.name as assigned_attorney_name,
  -- Primary in-court attorney
  pa.name as primary_attorney_name,
  -- Secondary in-court attorney  
  seca.name as secondary_attorney_name,
  -- Court information
  court.name as court_name,
  court.address_city as court_city
FROM dockets d
JOIN client_docket_assignments cda ON d.id = cda.docket_id
JOIN clients c ON cda.client_id = c.id
LEFT JOIN courts court ON d.court_id = court.id
LEFT JOIN staff_users sa ON c.attorney_id = sa.id
LEFT JOIN docket_attorneys da_primary ON cda.id = da_primary.client_docket_assignment_id AND da_primary.attorney_role = 'primary'
LEFT JOIN staff_users pa ON da_primary.attorney_id = pa.id
LEFT JOIN docket_attorneys da_secondary ON cda.id = da_secondary.client_docket_assignment_id AND da_secondary.attorney_role = 'secondary'
LEFT JOIN staff_users seca ON da_secondary.attorney_id = seca.id
WHERE d.is_active = true AND cda.id IS NOT NULL
ORDER BY d.docket_date, c.last_name, c.first_name;

-- Insert sample attorneys (you can modify these or add more)
INSERT INTO staff_users (email, name, role) VALUES
('john.smith@24thcircuitpd.org', 'John Smith', 'attorney'),
('sarah.johnson@24thcircuitpd.org', 'Sarah Johnson', 'attorney'),
('michael.davis@24thcircuitpd.org', 'Michael Davis', 'attorney')
ON CONFLICT (email) DO NOTHING;

-- Create a function to get attorneys for dropdowns
CREATE OR REPLACE FUNCTION get_attorneys()
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  email VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT su.id, su.name, su.email
  FROM staff_users su
  WHERE su.role = 'attorney' AND (su.is_active IS NULL OR su.is_active = true)
  ORDER BY su.name;
END;
$$ LANGUAGE plpgsql;
