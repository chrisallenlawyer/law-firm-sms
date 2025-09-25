-- Enable Row Level Security on all tables
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- Staff users policies
CREATE POLICY "Staff can view all staff users" ON staff_users
  FOR SELECT USING (true);

CREATE POLICY "Staff can update own profile" ON staff_users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Clients policies
CREATE POLICY "Staff can view all clients" ON clients
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert clients" ON clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update clients" ON clients
  FOR UPDATE USING (true);

CREATE POLICY "Staff can delete clients" ON clients
  FOR DELETE USING (true);

-- Court dates policies
CREATE POLICY "Staff can view all court dates" ON court_dates
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert court dates" ON court_dates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update court dates" ON court_dates
  FOR UPDATE USING (true);

CREATE POLICY "Staff can delete court dates" ON court_dates
  FOR DELETE USING (true);

-- SMS templates policies
CREATE POLICY "Staff can view all SMS templates" ON sms_templates
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert SMS templates" ON sms_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update SMS templates" ON sms_templates
  FOR UPDATE USING (true);

CREATE POLICY "Staff can delete SMS templates" ON sms_templates
  FOR DELETE USING (true);

-- SMS messages policies
CREATE POLICY "Staff can view all SMS messages" ON sms_messages
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert SMS messages" ON sms_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update SMS messages" ON sms_messages
  FOR UPDATE USING (true);

CREATE POLICY "Staff can delete SMS messages" ON sms_messages
  FOR DELETE USING (true);

-- Delivery logs policies
CREATE POLICY "Staff can view all delivery logs" ON delivery_logs
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert delivery logs" ON delivery_logs
  FOR INSERT WITH CHECK (true);

-- Client portal policies (for future client access)
-- These will be enabled when client authentication is implemented

-- CREATE POLICY "Clients can view own data" ON clients
--   FOR SELECT USING (auth.uid()::text = id::text);

-- CREATE POLICY "Clients can view own court dates" ON court_dates
--   FOR SELECT USING (client_id IN (
--     SELECT id FROM clients WHERE auth.uid()::text = id::text
--   ));

-- CREATE POLICY "Clients can view own SMS messages" ON sms_messages
--   FOR SELECT USING (client_id IN (
--     SELECT id FROM clients WHERE auth.uid()::text = id::text
--   ));
