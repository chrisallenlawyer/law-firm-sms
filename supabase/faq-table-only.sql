-- FAQ Table Only
-- Run this if you only need the FAQ table and not the full site management schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- FAQ table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100), -- e.g., 'General', 'Court Appearances', 'Legal Process'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES staff_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger
CREATE TRIGGER IF NOT EXISTS update_faqs_updated_at 
  BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample FAQs
INSERT INTO faqs (question, answer, category, display_order, is_active) VALUES
('How do I know if I qualify for a public defender?', 'To qualify for a public defender, you must demonstrate that you cannot afford to hire a private attorney. The court will evaluate your financial situation and determine if you meet the income requirements for indigent defense services.', 'General', 1, true),
('What should I bring to my court appearance?', 'Bring all documents related to your case, a valid photo ID, and any paperwork given to you by the court or our office. Arrive 15 minutes early and dress appropriately for court.', 'Court Appearances', 2, true),
('How will I be notified about my court dates?', 'We will send you text message reminders about your upcoming court appearances. You will also receive official court notices in the mail. Please keep your contact information updated with our office.', 'Court Appearances', 3, true),
('What if I cannot attend my scheduled court date?', 'If you cannot attend your court date, contact our office immediately. Missing a court date can result in a warrant for your arrest. We can help you request a continuance if there is a valid reason.', 'Court Appearances', 4, true),
('How long does the legal process take?', 'The length of your case depends on many factors including the type of charges, court scheduling, and case complexity. Your attorney will explain the expected timeline for your specific situation.', 'Legal Process', 5, true),
('Can I change my public defender?', 'Generally, you cannot choose your specific public defender. However, if you have concerns about your representation, please discuss them with your attorney or contact our office supervisor.', 'General', 6, true)

ON CONFLICT DO NOTHING;
