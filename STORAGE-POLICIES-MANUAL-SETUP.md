# Manual Storage Policies Setup Guide

Due to Supabase permission restrictions, storage policies need to be set up through the Dashboard UI rather than SQL scripts.

## Step 1: Create the Bucket (SQL or Dashboard)

### Option A: Using SQL (Recommended)
Run this in the Supabase SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images',
  'site-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

### Option B: Using Dashboard
1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Configure:
   - **Name**: `site-images`
   - **Public bucket**: ✓ Checked
   - **File size limit**: 5242880 bytes
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`
4. Click **Create Bucket**

## Step 2: Set Up Storage Policies (Dashboard Only)

After creating the bucket, you need to set up RLS policies:

### Navigate to Policies
1. In Supabase Dashboard, go to **Storage**
2. Click on the **site-images** bucket
3. Click on the **Policies** tab (or configuration section)
4. You should see options to add policies

### Policy 1: Public Read Access (SELECT)
This allows anyone to view/download images (required for your public website):

**Name**: `Public can view site images`  
**Allowed operation**: `SELECT`  
**Policy definition**:
```sql
bucket_id = 'site-images'
```
**Target roles**: `public` (or leave blank to apply to all)

### Policy 2: Authenticated Upload (INSERT)
This allows authenticated admin/staff users to upload images:

**Name**: `Authenticated users can upload site images`  
**Allowed operation**: `INSERT`  
**Policy definition**:
```sql
bucket_id = 'site-images' AND (
  auth.jwt()->>'role' = 'admin' OR 
  auth.jwt()->>'role' = 'staff'
)
```
**Target roles**: `authenticated`

### Policy 3: Authenticated Update (UPDATE)
This allows authenticated admin/staff users to update images:

**Name**: `Authenticated users can update site images`  
**Allowed operation**: `UPDATE`  
**Policy definition**:
```sql
bucket_id = 'site-images' AND (
  auth.jwt()->>'role' = 'admin' OR 
  auth.jwt()->>'role' = 'staff'
)
```
**Target roles**: `authenticated`

### Policy 4: Authenticated Delete (DELETE)
This allows authenticated admin/staff users to delete images:

**Name**: `Authenticated users can delete site images`  
**Allowed operation**: `DELETE`  
**Policy definition**:
```sql
bucket_id = 'site-images' AND (
  auth.jwt()->>'role' = 'admin' OR 
  auth.jwt()->>'role' = 'staff'
)
```
**Target roles**: `authenticated`

## Alternative: Simplified Policies

If the role-based policies above don't work (because the JWT doesn't contain a 'role' field), use these simpler policies:

### For Upload/Update/Delete:
**Policy definition** (for all three operations):
```sql
bucket_id = 'site-images' AND auth.role() = 'authenticated'
```

This will allow any authenticated user to manage images. If you need stricter control, you can add additional checks based on your `staff_users` table.

## Step 3: Verify the Setup

### Check Bucket
```sql
SELECT * FROM storage.buckets WHERE id = 'site-images';
```

Expected result: One row with your bucket configuration

### Check Policies
```sql
SELECT * 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (qual LIKE '%site-images%' OR with_check LIKE '%site-images%');
```

Expected result: 4 policies (SELECT, INSERT, UPDATE, DELETE)

## Step 4: Test Upload

1. Log in to your admin dashboard
2. Go to `/admin/site-dashboard/images`
3. Try uploading a test image
4. If successful, check the Storage section in Supabase to see your uploaded file

## Troubleshooting

### Upload fails with "new row violates row-level security"
- Check that you're logged in as an authenticated user
- Verify the INSERT policy exists and is enabled
- Check that the policy definition matches your user's JWT claims

### Images don't display on the website
- Verify the bucket is set to **Public** (checked)
- Check that the SELECT policy exists for public access
- Verify the file path is correct in the database

### "Permission denied" errors
- Make sure you're logged in with admin/staff role
- Check the JWT token includes the role claim
- Verify policies are checking the correct fields

### Can't delete images
- Ensure DELETE policy exists
- Check that your user has the correct role
- Verify the policy conditions match your user's JWT

## Alternative Approach: Disable RLS Temporarily

⚠️ **Not recommended for production** - Only for testing

If you just want to test the functionality quickly:

1. In Supabase Dashboard → Storage → site-images bucket
2. Go to Policies
3. Look for an option to "Disable RLS" or add a very permissive policy

Example permissive policy (all operations):
```sql
-- For INSERT, UPDATE, DELETE operations
bucket_id = 'site-images' AND auth.role() = 'authenticated'

-- For SELECT operation
bucket_id = 'site-images'
```

Once everything is working, you can refine the policies to be more restrictive.

## Notes

- The Supabase Dashboard UI for policies may vary slightly depending on your version
- Some Supabase projects have a "New policy" button, others have a policy editor
- If you can't find the policies UI, look in the Storage → Bucket Configuration section
- The JWT claims depend on how your authentication is set up in Supabase

## Success Criteria

✅ Bucket exists and is public  
✅ Can upload images when logged in  
✅ Images are accessible via public URL  
✅ Can delete images when logged in  
✅ Homepage displays uploaded images correctly

---

**Need More Help?**

If you're still having issues, check:
1. Supabase Dashboard → Authentication → Policies
2. Your JWT token structure (inspect in browser dev tools)
3. Supabase logs for specific error messages

