# Image Management Setup Guide

## Overview
This guide explains how to set up and use the image management system for rotating hero images on the homepage.

## Database Setup

### 1. Run the Site Management Schema
If you haven't already, run the site management schema to create the necessary tables:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/site-management-schema.sql
```

This creates the `site_images` table with the following structure:
- `id`: UUID primary key
- `filename`: Unique filename in storage
- `original_name`: Original uploaded filename
- `file_path`: Full URL to the image
- `file_size`: Size in bytes
- `mime_type`: Image MIME type
- `image_type`: Enum ('courthouse', 'office', 'general')
- `alt_text`: Alt text for accessibility
- `display_order`: Order for display rotation
- `is_active`: Whether the image is active
- `is_featured`: Whether the image is featured
- Timestamps and user tracking

### 2. Set Up Storage Bucket
Run the storage setup SQL to create the bucket and policies:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/storage-setup.sql
```

This will:
- Create a public `site-images` bucket
- Set 5MB file size limit
- Restrict to image MIME types only
- Set up RLS policies for secure access

### Alternative: Manual Bucket Creation

If you prefer to create the bucket manually in Supabase Dashboard:

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Configure:
   - **Name**: `site-images`
   - **Public**: Yes (checked)
   - **File size limit**: 5242880 bytes (5MB)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`
4. Click **Create Bucket**

Then set up policies in the SQL Editor:
```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Add policies (see storage-setup.sql for full policies)
```

## Using the Image Management System

### Accessing the Image Manager

1. Log in to the admin panel at `/admin/login`
2. Navigate to **Site Dashboard** → **Manage Images**
3. Or go directly to `/admin/site-dashboard/images`

### Uploading Images

1. Click on the upload area or drag and drop images
2. Multiple images can be uploaded at once
3. Supported formats: JPG, PNG, WEBP
4. Maximum size: 5MB per image
5. Recommended dimensions: 1200x800px or similar aspect ratio

### Managing Images

Each uploaded image has the following controls:

- **Image Type**: Select 'courthouse', 'office', or 'general'
  - **Courthouse** images appear in the hero rotation on the homepage
  - **Office** and **General** are for future features
- **Display Order**: Change the number to reorder images in rotation
- **Activate/Deactivate**: Toggle whether the image appears in rotation
- **Set Featured**: Mark an image as featured (for future use)
- **Delete**: Permanently remove the image

### Hero Image Rotation

The `RotatingCourthouseImages` component on the homepage will:
1. Fetch all active images with `image_type = 'courthouse'`
2. Rotate through them every 4 seconds
3. Display them in order by `display_order`
4. Show placeholder graphics if no images are uploaded

## Component Architecture

### Key Files

1. **SiteImagesManagement.tsx** (`src/components/SiteImagesManagement.tsx`)
   - Client-side component for image management UI
   - Handles upload, delete, update operations
   - Displays image grid with controls

2. **RotatingCourthouseImages.tsx** (`src/components/RotatingCourthouseImages.tsx`)
   - Client-side component for hero image rotation
   - Fetches active courthouse images from API
   - Falls back to placeholder graphics if no images

3. **API Routes**:
   - `GET /api/site-images` - Fetch all images
   - `POST /api/site-images/upload` - Upload new image
   - `PATCH /api/site-images/[id]` - Update image properties
   - `DELETE /api/site-images/[id]` - Delete image

## Image Guidelines

### Recommended Specifications
- **Format**: JPG, PNG, or WEBP
- **Size**: Maximum 5MB per image
- **Dimensions**: 1200x800px (3:2 aspect ratio) recommended
- **Quality**: High resolution for web display
- **Optimization**: Compress images before upload for faster loading

### Image Types
- **Courthouse**: Courthouse buildings, courtrooms (used in hero rotation)
- **Office**: Office interiors, staff photos
- **General**: Community photos, events

## Troubleshooting

### Images Not Uploading
1. Check that the storage bucket exists in Supabase
2. Verify RLS policies are set up correctly
3. Check file size (must be under 5MB)
4. Ensure file type is supported (JPG, PNG, WEBP)
5. Check browser console for error messages

### Images Not Displaying on Homepage
1. Verify images are set to `is_active = true`
2. Ensure `image_type = 'courthouse'`
3. Check that `file_path` is a valid URL
4. Verify the storage bucket is public
5. Check browser console for loading errors

### Storage Bucket Issues
If you're getting 404 errors on images:
1. Ensure the bucket is set to **public**
2. Check the bucket name is exactly `site-images`
3. Verify the file exists in storage
4. Check RLS policies allow public SELECT

### Permission Errors
If uploads are failing with permission errors:
1. Verify you're logged in as admin or staff
2. Check the JWT contains the correct role
3. Verify RLS policies allow INSERT for your role
4. Check `staff_users` table has your user with correct role

## Future Enhancements

Potential improvements to consider:
- Drag-and-drop reordering interface
- Image cropping/editing tools
- Bulk upload with progress indicators
- Image optimization on upload
- Multiple image sizes for responsive design
- Alt text editing interface
- Image categories and tags
- Search and filter capabilities

## Support

For issues or questions:
1. Check the browser console for errors
2. Review Supabase logs in the dashboard
3. Verify database schema and storage setup
4. Check API route responses in Network tab

