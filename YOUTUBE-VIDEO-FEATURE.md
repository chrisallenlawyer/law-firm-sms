# YouTube Video Player Feature

## Overview
A complete YouTube video/playlist management system has been added to the website. Admins can configure which YouTube videos or playlists are displayed on the homepage, and visitors will see them in a professional video player below the "Our Mission" section.

## Features Implemented

### 1. **Database Schema** (`supabase/youtube-videos-schema.sql`)
- New table: `youtube_videos`
- Supports both single videos and playlists
- Fields include:
  - `title` - Video/playlist title
  - `description` - Optional description
  - `video_type` - Either "video" or "playlist"
  - `youtube_id` - YouTube video ID or playlist ID
  - `is_active` - Controls visibility on homepage
  - `display_order` - Order of display (0, 1, 2, etc.)
  - Timestamps and creator tracking
- Row Level Security (RLS) policies configured
- Public can view active videos, authenticated users can manage

### 2. **API Endpoints**
#### `/api/youtube-videos` (GET, POST)
- **GET**: Fetch all videos (with optional `?active=true` filter)
- **POST**: Create new video entry (requires authentication)

#### `/api/youtube-videos/[id]` (GET, PATCH, DELETE)
- **GET**: Fetch single video by ID
- **PATCH**: Update video details
- **DELETE**: Remove video

### 3. **Admin Interface** (`/admin/site-dashboard/videos`)
- **Full CRUD Operations**: Add, Edit, Delete videos
- **Smart URL Extraction**: Paste full YouTube URLs and the system extracts the ID automatically
- **Toggle Active Status**: Quickly enable/disable videos with one click
- **Display Order Management**: Control the order videos appear
- **Preview Links**: Direct links to view videos on YouTube
- **Type Indicators**: Visual badges for video vs playlist
- **Instructions**: Built-in help text for adding videos

**Access**: Admin Dashboard → Manage Website → Manage Videos

### 4. **Homepage Video Player** (`/`)
- **Responsive Design**: Looks great on all devices
- **Auto-hide**: Section doesn't display if no active videos
- **Multiple Video Support**: 
  - Navigation arrows to switch between videos
  - Dot indicators showing current video
  - Clickable video list below player
- **Single Video Mode**: Clean display without navigation elements
- **Professional Styling**: Matches existing homepage design
- **Loading States**: Smooth skeleton loading while fetching

## How to Use

### Setting Up Videos (Admin)

1. **Navigate to Admin Area**:
   - Go to `/admin/enhanced-dashboard`
   - Click "Manage Website"
   - Click "Manage Videos"

2. **Add a Video**:
   - Click "Add Video" button
   - Enter a title (e.g., "Welcome to Our Office")
   - Add optional description
   - Select type: "Single Video" or "Playlist"
   - Paste YouTube URL or ID:
     - **Video URL**: `https://www.youtube.com/watch?v=VIDEO_ID`
     - **Playlist URL**: `https://www.youtube.com/playlist?list=PLAYLIST_ID`
     - Or just enter the ID directly
   - Set display order (0 = first, 1 = second, etc.)
   - Check "Display on homepage" to make it visible
   - Click "Create"

3. **Edit a Video**:
   - Click "Edit" next to any video
   - Make changes
   - Click "Update"

4. **Toggle Visibility**:
   - Click the "Active"/"Inactive" badge to toggle
   - Active videos appear on homepage immediately

5. **Delete a Video**:
   - Click "Delete" next to any video
   - Confirm deletion

### Finding YouTube IDs

**For a Single Video:**
- Go to the video on YouTube
- Look at the URL: `youtube.com/watch?v=dQw4w9WgXcQ`
- The ID is: `dQw4w9WgXcQ`
- Or just paste the full URL - the system extracts it automatically!

**For a Playlist:**
- Go to the playlist on YouTube
- Look at the URL: `youtube.com/playlist?list=PLrAXtmErZgOe...`
- The ID is: `PLrAXtmErZgOe...` (starts with PL)
- Or paste the full URL!

## Technical Details

### Component Structure

```
src/
├── app/
│   ├── api/
│   │   └── youtube-videos/
│   │       ├── route.ts              # Main API endpoint
│   │       └── [id]/route.ts         # Individual video operations
│   └── admin/
│       └── site-dashboard/
│           └── videos/page.tsx       # Admin management page
└── components/
    ├── YouTubeVideosManagement.tsx  # Admin interface component
    └── YouTubeVideoPlayer.tsx       # Homepage player component
```

### Database Migration

To apply the schema to your Supabase database:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Open the file: `supabase/youtube-videos-schema.sql`
4. Copy and paste the contents
5. Run the query

Or use Supabase CLI:
```bash
supabase db push
```

### Security

- **Authentication Required**: Only authenticated users can add/edit/delete videos
- **RLS Policies**: Database-level security ensures proper access control
- **Public Read**: Anonymous visitors can view active videos only
- **Input Validation**: YouTube IDs are validated, malicious input is rejected

## Examples

### Example 1: Welcome Video
- **Title**: "Welcome to the Public Defender's Office"
- **Type**: Single Video
- **ID**: Enter your YouTube video ID
- **Description**: "Learn about our mission and services"
- **Display Order**: 0

### Example 2: Legal Rights Playlist
- **Title**: "Know Your Legal Rights"
- **Type**: Playlist
- **ID**: Enter your YouTube playlist ID
- **Description**: "Educational series about your rights"
- **Display Order**: 1

## Styling and UX

- **Consistent Design**: Matches existing homepage aesthetic
- **Smooth Transitions**: Animated video switching
- **Accessibility**: Keyboard navigation supported
- **Mobile Responsive**: Touch-friendly controls
- **Loading States**: Professional skeleton loaders
- **Error Handling**: Graceful failures with user feedback

## Future Enhancements (Optional)

- Auto-play support with mute
- Video thumbnails in navigation
- View count tracking
- Category organization
- Scheduled video display (date-based activation)
- Analytics integration

## Files Created/Modified

### New Files:
1. `supabase/youtube-videos-schema.sql` - Database schema
2. `src/app/api/youtube-videos/route.ts` - API endpoint
3. `src/app/api/youtube-videos/[id]/route.ts` - Individual video API
4. `src/components/YouTubeVideosManagement.tsx` - Admin component
5. `src/app/admin/site-dashboard/videos/page.tsx` - Admin page
6. `src/components/YouTubeVideoPlayer.tsx` - Homepage player
7. `YOUTUBE-VIDEO-FEATURE.md` - This documentation

### Modified Files:
1. `src/app/page.tsx` - Added video player to homepage
2. `src/app/admin/site-dashboard/page.tsx` - Added "Manage Videos" link

## Testing Checklist

- [ ] Run database migration in Supabase
- [ ] Test adding a single video in admin
- [ ] Test adding a playlist in admin
- [ ] Verify video appears on homepage
- [ ] Test toggling video active/inactive status
- [ ] Test editing video details
- [ ] Test deleting a video
- [ ] Test with multiple videos (navigation)
- [ ] Test on mobile devices
- [ ] Test with no videos (section should hide)

## Support

If you encounter any issues:
1. Check Supabase connection in browser console
2. Verify database migration was successful
3. Ensure RLS policies are enabled
4. Check that YouTube IDs are correct
5. Verify videos are marked as "active"

---

**Status**: ✅ Complete and Ready for Use  
**Last Updated**: October 2025  
**Version**: 1.0

