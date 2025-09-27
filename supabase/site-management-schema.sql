-- Site Management Database Schema
-- This file contains all the tables needed for the Site Dashboard features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'client', 'anonymous');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE image_type AS ENUM ('courthouse', 'office', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced staff_users table with more fields
ALTER TABLE staff_users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES staff_users(id);

-- Note: user_role enum already includes all needed values

-- Site images table for managing rotating images
CREATE TABLE IF NOT EXISTS site_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  image_type image_type DEFAULT 'courthouse',
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES staff_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site content table for managing homepage content
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_key VARCHAR(100) UNIQUE NOT NULL,
  content_value TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text', -- text, html, json
  section VARCHAR(100) NOT NULL, -- hero, mission, contact, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES staff_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site settings table for general configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- whether this setting can be accessed publicly
  updated_by UUID REFERENCES staff_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_images_type ON site_images(image_type);
CREATE INDEX IF NOT EXISTS idx_site_images_active ON site_images(is_active);
CREATE INDEX IF NOT EXISTS idx_site_images_order ON site_images(display_order);
CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(content_key);
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section);
CREATE INDEX IF NOT EXISTS idx_site_content_active ON site_content(is_active);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_public ON site_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_staff_users_active ON staff_users(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_site_images_updated_at ON site_images;
CREATE TRIGGER update_site_images_updated_at 
  BEFORE UPDATE ON site_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_content_updated_at ON site_content;
CREATE TRIGGER update_site_content_updated_at 
  BEFORE UPDATE ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at 
  BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default site content
INSERT INTO site_content (content_key, content_value, content_type, section, description) VALUES
-- Hero Section
('hero_title', 'Protecting Your Rights', 'text', 'hero', 'Main hero title'),
('hero_subtitle', 'Dedicated legal representation for Fayette, Lamar, and Pickens Counties', 'text', 'hero', 'Hero subtitle text'),
('hero_cta_primary', 'Get Legal Help', 'text', 'hero', 'Primary call-to-action button text'),
('hero_cta_secondary', 'Learn More', 'text', 'hero', 'Secondary call-to-action button text'),

-- Mission Section
('mission_title', 'Our Mission', 'text', 'mission', 'Mission section title'),
('mission_text', 'To professionally and diligently represent clients in the community who are unable to pay for an attorney.', 'text', 'mission', 'Mission statement text'),

-- Office Information
('office_fayette_name', 'Fayette County Office', 'text', 'offices', 'Fayette County office name'),
('office_fayette_address', 'Fayette County Courthouse<br />Fayette, Alabama', 'html', 'offices', 'Fayette County office address'),
('office_fayette_phone', '(205) 555-0123', 'text', 'offices', 'Fayette County office phone'),

('office_lamar_name', 'Lamar County Office', 'text', 'offices', 'Lamar County office name'),
('office_lamar_address', 'Lamar County Courthouse<br />Vernon, Alabama', 'html', 'offices', 'Lamar County office address'),
('office_lamar_phone', '(205) 555-0124', 'text', 'offices', 'Lamar County office phone'),

('office_pickens_name', 'Pickens County Office', 'text', 'offices', 'Pickens County office name'),
('office_pickens_address', 'Pickens County Courthouse<br />Carrollton, Alabama', 'html', 'offices', 'Pickens County office address'),
('office_pickens_phone', '(205) 555-0125', 'text', 'offices', 'Pickens County office phone'),

-- Contact Section
('contact_title', 'Contact Information', 'text', 'contact', 'Contact section title'),
('contact_subtitle', 'Need legal assistance? Contact our office for help.', 'text', 'contact', 'Contact section subtitle'),
('contact_phone', '(205) 555-0123', 'text', 'contact', 'Main contact phone number'),
('contact_email', 'info@24thcircuitpd.org', 'text', 'contact', 'Main contact email'),
('contact_hours', 'Mon-Fri: 8:00 AM - 5:00 PM', 'text', 'contact', 'Office hours'),

-- Footer
('footer_description', 'Dedicated to providing quality legal representation to the citizens of Fayette, Lamar, and Pickens Counties.', 'text', 'footer', 'Footer description text'),
('footer_copyright', '© 2024 24th Judicial Circuit Public Defender. All rights reserved.', 'text', 'footer', 'Copyright text')

ON CONFLICT (content_key) DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', '24th Judicial Circuit Public Defender', 'string', 'Website name', true),
('site_tagline', 'Protecting Your Rights', 'string', 'Website tagline', true),
('site_description', 'Dedicated legal representation for Fayette, Lamar, and Pickens Counties', 'string', 'Website description', true),
('contact_email', 'info@24thcircuitpd.org', 'string', 'Main contact email', true),
('contact_phone', '(205) 555-0123', 'string', 'Main contact phone', true),
('office_hours', 'Mon-Fri: 8:00 AM - 5:00 PM', 'string', 'Office hours', true),
('image_rotation_speed', '5000', 'number', 'Image rotation speed in milliseconds', false),
('max_upload_size', '5242880', 'number', 'Maximum file upload size in bytes (5MB)', false),
('allowed_image_types', '["image/jpeg", "image/png", "image/webp"]', 'json', 'Allowed image MIME types', false)

ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample site images (you'll need to upload actual images)
INSERT INTO site_images (filename, original_name, file_path, file_size, mime_type, image_type, alt_text, display_order, is_active, is_featured) VALUES
('alabama-seal.jpg', 'AlabamaSeal.jpg', '/AlabamaSeal.jpg', 0, 'image/jpeg', 'courthouse', 'Alabama State Seal', 1, true, true)

ON CONFLICT DO NOTHING;

-- Create a view for active site content
CREATE OR REPLACE VIEW active_site_content AS
SELECT 
  content_key,
  content_value,
  content_type,
  section,
  description,
  updated_at
FROM site_content 
WHERE is_active = true
ORDER BY section, content_key;

-- Create a view for public site settings
CREATE OR REPLACE VIEW public_site_settings AS
SELECT 
  setting_key,
  setting_value,
  setting_type,
  description
FROM site_settings 
WHERE is_public = true
ORDER BY setting_key;

-- Create a view for active site images
CREATE OR REPLACE VIEW active_site_images AS
SELECT 
  id,
  filename,
  original_name,
  file_path,
  alt_text,
  image_type,
  display_order,
  is_featured
FROM site_images 
WHERE is_active = true
ORDER BY image_type, display_order;
