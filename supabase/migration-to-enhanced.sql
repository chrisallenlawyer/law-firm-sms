-- Migration script to upgrade from basic schema to enhanced schema
-- This script handles existing types and tables

-- Drop existing tables in correct order (due to foreign key constraints)
DROP TABLE IF EXISTS delivery_logs CASCADE;
DROP TABLE IF EXISTS sms_messages CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;
DROP TABLE IF EXISTS court_dates CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS staff_users CASCADE;

-- Create new tables with enhanced structure
-- Staff users table
CREATE TABLE staff_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Courts table (NEW)
CREATE TABLE courts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dockets table (NEW)
CREATE TABLE dockets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  docket_date DATE NOT NULL,
  docket_time TIME,
  judge_name VARCHAR(255),
  docket_type VARCHAR(100), -- e.g., 'Criminal', 'Civil', 'Family'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES staff_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced clients table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip VARCHAR(20),
  case_number VARCHAR(100),
  attorney_id UUID REFERENCES staff_users(id),
  case_status case_status DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client-Docket assignments (many-to-many)
CREATE TABLE client_docket_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  docket_id UUID REFERENCES dockets(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES staff_users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(client_id, docket_id)
);

-- Court dates table (keeping for historical records)
CREATE TABLE court_dates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  docket_id UUID REFERENCES dockets(id),
  case_number VARCHAR(100),
  court_date TIMESTAMP WITH TIME ZONE NOT NULL,
  court_location VARCHAR(255),
  case_type VARCHAR(100),
  status case_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS templates table (enhanced)
CREATE TABLE sms_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message_text TEXT NOT NULL,
  days_before INTEGER NOT NULL DEFAULT 1,
  court_id UUID REFERENCES courts(id), -- Court-specific templates
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES staff_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS messages table (enhanced)
CREATE TABLE sms_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  docket_id UUID REFERENCES dockets(id),
  template_id UUID REFERENCES sms_templates(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status sms_status DEFAULT 'pending',
  twilio_message_sid VARCHAR(255),
  confirmation_received BOOLEAN DEFAULT false,
  confirmation_received_at TIMESTAMP WITH TIME ZONE,
  message_text TEXT, -- Store the actual message sent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery logs table
CREATE TABLE delivery_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sms_id UUID REFERENCES sms_messages(id) ON DELETE CASCADE,
  status sms_status NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  twilio_response JSONB
);

-- Bulk SMS campaigns table (NEW)
CREATE TABLE sms_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  docket_id UUID REFERENCES dockets(id),
  template_id UUID REFERENCES sms_templates(id),
  custom_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, completed, failed
  total_recipients INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  created_by UUID REFERENCES staff_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clients_attorney_id ON clients(attorney_id);
CREATE INDEX idx_clients_name ON clients(first_name, last_name);
CREATE INDEX idx_dockets_court_date ON dockets(court_id, docket_date);
CREATE INDEX idx_dockets_date ON dockets(docket_date);
CREATE INDEX idx_client_docket_assignments_client ON client_docket_assignments(client_id);
CREATE INDEX idx_client_docket_assignments_docket ON client_docket_assignments(docket_id);
CREATE INDEX idx_court_dates_client_id ON court_dates(client_id);
CREATE INDEX idx_court_dates_court_date ON court_dates(court_date);
CREATE INDEX idx_sms_messages_client_id ON sms_messages(client_id);
CREATE INDEX idx_sms_messages_docket_id ON sms_messages(docket_id);
CREATE INDEX idx_sms_messages_scheduled_for ON sms_messages(scheduled_for);
CREATE INDEX idx_sms_messages_delivery_status ON sms_messages(delivery_status);
CREATE INDEX idx_delivery_logs_sms_id ON delivery_logs(sms_id);
CREATE INDEX idx_sms_campaigns_docket ON sms_campaigns(docket_id);
CREATE INDEX idx_sms_campaigns_status ON sms_campaigns(status);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_staff_users_updated_at BEFORE UPDATE ON staff_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dockets_updated_at BEFORE UPDATE ON dockets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_dates_updated_at BEFORE UPDATE ON court_dates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_messages_updated_at BEFORE UPDATE ON sms_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_campaigns_updated_at BEFORE UPDATE ON sms_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample courts
INSERT INTO courts (name, address_street, address_city, address_state, address_zip, phone) VALUES
('Superior Court of Justice', '123 Main Street', 'Downtown', 'State', '12345', '(555) 123-4567'),
('Municipal Court', '456 Oak Avenue', 'Midtown', 'State', '12346', '(555) 234-5678'),
('Family Court', '789 Pine Street', 'Uptown', 'State', '12347', '(555) 345-6789');

-- Insert sample SMS templates
INSERT INTO sms_templates (name, message_text, days_before, is_active) VALUES
('Court Reminder - 7 Days', 'Hello {first_name}, this is a reminder that you have a court appearance scheduled for {court_date} at {court_location}. Please arrive 15 minutes early. If you have any questions, contact our office at {phone_number}.', 7, true),
('Court Reminder - 3 Days', 'Hello {first_name}, your court appearance is in 3 days on {court_date} at {court_location}. Please confirm your attendance by replying to this message.', 3, true),
('Court Reminder - 1 Day', 'URGENT: Your court appearance is tomorrow, {court_date} at {court_location}. Please arrive at {time}. Bring all required documents. Contact us immediately if you cannot attend.', 1, true);

-- Insert your first admin user (update with your actual email)
INSERT INTO staff_users (email, name, role) 
VALUES ('admin@yourlawfirm.com', 'Admin User', 'admin');
