-- Media Files and Transcription Schema for Law Firm SMS System (Fixed for existing types)
-- This schema supports audio/video file uploads, transcription, and client linking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for transcription status (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE transcription_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Media files table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS media_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  original_filename VARCHAR(255) NOT NULL,
  supabase_file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('audio', 'video')),
  file_size BIGINT,
  duration_seconds INTEGER,
  custom_filename VARCHAR(255), -- User-added name (optional)
  transcript TEXT,
  transcription_status transcription_status DEFAULT 'pending',
  error_message TEXT, -- Why transcription failed
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- Optional link to client
  case_number VARCHAR(100), -- Optional case reference
  uploaded_by UUID REFERENCES staff_users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transcribed_at TIMESTAMP WITH TIME ZONE,
  transcript_completed_at TIMESTAMP WITH TIME ZONE,
  cleanup_scheduled_at TIMESTAMP WITH TIME ZONE,
  media_file_deleted BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_client_id ON media_files(client_id);
CREATE INDEX IF NOT EXISTS idx_media_files_status ON media_files(transcription_status);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);
CREATE INDEX IF NOT EXISTS idx_media_files_cleanup_scheduled ON media_files(cleanup_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_media_files_case_number ON media_files(case_number);

-- Create a full-text search index for transcripts and filenames (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_media_files_search ON media_files USING gin(
  to_tsvector('english', 
    COALESCE(original_filename, '') || ' ' || 
    COALESCE(custom_filename, '') || ' ' || 
    COALESCE(transcript, '') || ' ' || 
    COALESCE(case_number, '')
  )
);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON media_files
  FOR EACH ROW
  EXECUTE FUNCTION update_media_files_updated_at();

-- Function to automatically set cleanup_scheduled_at when transcript is completed
CREATE OR REPLACE FUNCTION set_cleanup_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- If transcript is completed and cleanup_scheduled_at is not set
  IF NEW.transcription_status = 'completed' 
     AND NEW.transcript_completed_at IS NOT NULL 
     AND NEW.cleanup_scheduled_at IS NULL THEN
    NEW.cleanup_scheduled_at = NEW.transcript_completed_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically schedule cleanup when transcript is completed
DROP TRIGGER IF EXISTS set_cleanup_schedule_trigger ON media_files;
CREATE TRIGGER set_cleanup_schedule_trigger
  BEFORE UPDATE ON media_files
  FOR EACH ROW
  EXECUTE FUNCTION set_cleanup_schedule();

-- Row Level Security (RLS) policies
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Staff can view all media files" ON media_files;
DROP POLICY IF EXISTS "Staff can insert media files" ON media_files;
DROP POLICY IF EXISTS "Staff can update media files" ON media_files;
DROP POLICY IF EXISTS "Staff can delete media files" ON media_files;

-- Policy: Staff, attorneys, and admins can view all media files
CREATE POLICY "Staff can view all media files" ON media_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.id = auth.uid() 
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  );

-- Policy: Staff, attorneys, and admins can insert media files
CREATE POLICY "Staff can insert media files" ON media_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.id = auth.uid() 
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  );

-- Policy: Staff, attorneys, and admins can update media files
CREATE POLICY "Staff can update media files" ON media_files
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.id = auth.uid() 
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.id = auth.uid() 
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  );

-- Policy: Staff, attorneys, and admins can delete media files
CREATE POLICY "Staff can delete media files" ON media_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users 
      WHERE staff_users.id = auth.uid() 
      AND staff_users.role IN ('admin', 'staff', 'attorney')
    )
  );

-- Comments for documentation
COMMENT ON TABLE media_files IS 'Stores audio/video files and their transcriptions for the law firm';
COMMENT ON COLUMN media_files.custom_filename IS 'User-defined name for easier identification';
COMMENT ON COLUMN media_files.cleanup_scheduled_at IS 'When the media file should be deleted (30 days after transcription completion)';
COMMENT ON COLUMN media_files.media_file_deleted IS 'Whether the actual media file has been deleted from storage';
COMMENT ON COLUMN media_files.duration_seconds IS 'Duration of the media file in seconds';
COMMENT ON COLUMN media_files.case_number IS 'Optional case number for linking to specific legal cases';
