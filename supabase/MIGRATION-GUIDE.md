# Database Migration Guide

This guide explains how to set up the database tables needed for the Site Dashboard features.

## Quick Start (FAQ Only)

If you only need the FAQ functionality right now, run this file:
- `faq-table-only.sql` - Creates just the FAQ table with sample data

## Full Site Management Setup

For the complete Site Dashboard with all features, run:
- `site-management-schema.sql` - Creates all tables for user management, image management, and content management

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

### 2. Open SQL Editor
1. Click on "SQL Editor" in the left sidebar
2. Click "New query"

### 3. Run the Migration
Copy and paste the contents of one of the SQL files into the editor, then click "Run".

### 4. Verify the Tables
After running the migration, you can verify the tables were created by:
1. Going to "Table Editor" in the left sidebar
2. You should see the new tables:
   - `faqs` (for FAQ management)
   - `site_images` (for image management)
   - `site_content` (for content management)
   - `site_settings` (for site configuration)

## What Each Table Does

### `faqs`
- Stores frequently asked questions
- Includes categories, display order, and active status
- Used by the FAQ management system

### `site_images`
- Stores information about uploaded images
- Manages rotating courthouse images
- Includes file metadata and display settings

### `site_content`
- Stores editable homepage content
- Includes office addresses, contact info, mission text
- Allows dynamic content updates without code changes

### `site_settings`
- Stores site-wide configuration
- Includes contact information, office hours, etc.
- Can be public or private settings

## Troubleshooting

### If you get permission errors:
- Make sure you're logged in as the project owner
- Check that your database user has the necessary permissions

### If tables already exist:
- The SQL files use `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT DO NOTHING`
- This means they won't overwrite existing data
- You can run them safely multiple times

### If you need to start over:
- You can drop tables manually in the Table Editor
- Or run `DROP TABLE` commands in the SQL Editor

## Next Steps

After running the migration:
1. The FAQ system will work immediately
2. You can start adding FAQs through the admin interface
3. The other features (user management, image management, content management) will be available once we implement the frontend components

## Support

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify your environment variables are set correctly
3. Make sure your database connection is working



