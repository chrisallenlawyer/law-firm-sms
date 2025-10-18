-- YouTube Videos Management Schema
-- This table stores YouTube video/playlist configurations for the homepage

-- Create youtube_videos table
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_type TEXT NOT NULL CHECK (video_type IN ('video', 'playlist')),
  youtube_id TEXT NOT NULL, -- Video ID or Playlist ID
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES staff_users(id) ON DELETE SET NULL
);

-- Create index for active videos ordered by display_order
CREATE INDEX IF NOT EXISTS idx_youtube_videos_active_order 
ON youtube_videos (is_active, display_order);

-- Create index for created_by
CREATE INDEX IF NOT EXISTS idx_youtube_videos_created_by 
ON youtube_videos (created_by);

-- Enable Row Level Security
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read active videos
CREATE POLICY "Allow public to read active videos"
ON youtube_videos FOR SELECT
USING (is_active = true);

-- Policy: Allow authenticated users to read all videos
CREATE POLICY "Allow authenticated users to read all videos"
ON youtube_videos FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert videos
CREATE POLICY "Allow authenticated users to insert videos"
ON youtube_videos FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update videos
CREATE POLICY "Allow authenticated users to update videos"
ON youtube_videos FOR UPDATE
TO authenticated
USING (true);

-- Policy: Allow authenticated users to delete videos
CREATE POLICY "Allow authenticated users to delete videos"
ON youtube_videos FOR DELETE
TO authenticated
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_youtube_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_youtube_videos_updated_at_trigger ON youtube_videos;
CREATE TRIGGER update_youtube_videos_updated_at_trigger
  BEFORE UPDATE ON youtube_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_youtube_videos_updated_at();

-- Insert sample data (optional - comment out if not needed)
-- INSERT INTO youtube_videos (title, description, video_type, youtube_id, is_active, display_order)
-- VALUES 
--   ('Welcome to Our Office', 'Introduction to our public defender services', 'video', 'dQw4w9WgXcQ', true, 1),
--   ('Legal Rights Series', 'Educational playlist about your legal rights', 'playlist', 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf', true, 2);

COMMENT ON TABLE youtube_videos IS 'Stores YouTube video and playlist configurations for homepage display';
COMMENT ON COLUMN youtube_videos.video_type IS 'Type of YouTube content: video or playlist';
COMMENT ON COLUMN youtube_videos.youtube_id IS 'YouTube video ID or playlist ID';
COMMENT ON COLUMN youtube_videos.is_active IS 'Whether the video should be displayed on homepage';
COMMENT ON COLUMN youtube_videos.display_order IS 'Order in which videos are displayed (lower numbers first)';

