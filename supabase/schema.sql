-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'client');
CREATE TYPE sms_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'undelivered');
CREATE TYPE case_status AS ENUM ('active', 'closed', 'pending');

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

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  case_number VARCHAR(100),
  attorney_id UUID REFERENCES staff_users(id),
  case_status case_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Court dates table
CREATE TABLE court_dates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  case_number VARCHAR(100),
  court_date TIMESTAMP WITH TIME ZONE NOT NULL,
  court_location VARCHAR(255),
  case_type VARCHAR(100),
  status case_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS templates table
CREATE TABLE sms_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message_text TEXT NOT NULL,
  days_before INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES staff_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS messages table
CREATE TABLE sms_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES sms_templates(id),
  court_date_id UUID REFERENCES court_dates(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status sms_status DEFAULT 'pending',
  twilio_message_sid VARCHAR(255),
  confirmation_received BOOLEAN DEFAULT false,
  confirmation_received_at TIMESTAMP WITH TIME ZONE,
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

-- Create indexes for better performance
CREATE INDEX idx_clients_attorney_id ON clients(attorney_id);
CREATE INDEX idx_court_dates_client_id ON court_dates(client_id);
CREATE INDEX idx_court_dates_court_date ON court_dates(court_date);
CREATE INDEX idx_sms_messages_client_id ON sms_messages(client_id);
CREATE INDEX idx_sms_messages_scheduled_for ON sms_messages(scheduled_for);
CREATE INDEX idx_sms_messages_delivery_status ON sms_messages(delivery_status);
CREATE INDEX idx_delivery_logs_sms_id ON delivery_logs(sms_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_staff_users_updated_at BEFORE UPDATE ON staff_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_dates_updated_at BEFORE UPDATE ON court_dates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_messages_updated_at BEFORE UPDATE ON sms_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

