# Simple Storage Setup Instructions

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** (left sidebar)
3. Click **"New bucket"**
4. Configure:
   - **Name**: `media-files`
   - **Public**: ❌ Keep **PRIVATE**
   - **File size limit**: 500MB (or higher)
   - **Allowed MIME types**: Leave empty

## Step 2: Create Basic Storage Policy

Since we can't modify storage.objects directly via SQL, use the Supabase Dashboard:

1. Go to **Storage** → **media-files** bucket
2. Click on **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"Custom Policy"**
5. Create this policy:

### Policy Details:
- **Policy Name**: `Allow authenticated users to manage media files`
- **Target Roles**: `authenticated`
- **USING expression**: `bucket_id = 'media-files'`
- **WITH CHECK expression**: `bucket_id = 'media-files'`

This creates a simple policy that allows any authenticated user to upload, view, update, and delete files in the media-files bucket.

## Step 3: Test the Setup

After creating the bucket and policy:
1. Try uploading a file through your application
2. The upload should now work without 403 errors

## Future Enhancement

Later, we can create more restrictive policies that only allow staff users to access files by:
1. Going back to the Storage Policies
2. Editing the policy to include role checks
3. Using the staff_users table to verify user roles

For now, this simple setup will get your file uploads working!
