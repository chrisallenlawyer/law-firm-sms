# 🎙️ Media Files & Transcription Setup Guide

## 📋 Overview

The Law Firm SMS app now includes a comprehensive media files and transcription system that allows you to:
- Upload audio and video files
- Generate transcripts using Google Cloud Speech-to-Text
- Link files to specific clients and cases
- Search through transcripts and files
- Automatically clean up old media files after 30 days

## 🚀 Quick Setup

### 1. Apply Database Schema

Run the media files schema in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of supabase/media-files-schema.sql
```

This creates the `media_files` table with proper relationships, indexes, and Row Level Security policies.

### 2. Set Up Google Cloud Speech-to-Text

#### A. Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project named "Law-Firm-Transcriptions"
3. Enable billing (required for Speech-to-Text API)
4. Enable the **Speech-to-Text API**

#### B. Create Service Account
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. **Service Account ID**: `law-firm-transcription-service`
4. **Display Name**: "Law Firm Transcription Service"
5. Skip roles and permissions for now
6. Click "Done"

#### C. Generate Key File
1. Click on your new service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Choose "JSON" format
5. Download the file (keep it secure!)

#### D. Add to Environment Variables
Add these to your `.env.local` file:

```bash
# Google Cloud Speech-to-Text Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id",...}
```

**Option 1: File Path (Local Development)**
```bash
GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=./path/to/your/service-account-key.json
```

**Option 2: JSON String (Production/Vercel)**
```bash
GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### 3. Set Up Supabase Storage

#### A. Create Storage Bucket
1. Go to your Supabase project dashboard
2. Navigate to "Storage"
3. Create a new bucket named `media-files`
4. Set it to **Private** (for security)
5. Enable RLS (Row Level Security)

#### B. Set Storage Policies
Run this SQL in your Supabase SQL Editor:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media-files');

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view media files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media-files');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete media files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media-files');
```

## 🎯 Features

### ✅ **File Upload**
- Supports audio formats: MP3, WAV, WebM, OGG, FLAC, M4A
- Supports video formats: MP4, WebM, OGG, AVI, MOV
- Maximum file size: 2GB
- Automatic date-based naming with custom filename option
- Optional client and case number linking

### ✅ **Transcription**
- Google Cloud Speech-to-Text integration
- Optimized for legal terminology
- Speaker diarization (identifies different speakers)
- Automatic retry on failure
- Status tracking (pending, processing, completed, failed)

### ✅ **File Management**
- Search by filename, transcript content, client, or case number
- Filter by transcription status
- Pagination for large file lists
- Delete files and transcripts
- Link/unlink files to clients after upload

### ✅ **Auto-Cleanup**
- Media files automatically deleted 30 days after transcription completion
- Transcripts preserved indefinitely
- Manual cleanup API endpoint for admins
- Configurable retention policies

## 🔧 Usage

### Upload a File
1. Go to **Admin Dashboard** → **Manage Transcripts**
2. Click **Upload File**
3. Select your audio/video file
4. Add optional custom filename, client, and case number
5. Click **Upload**

### Generate Transcript
1. Find your uploaded file in the list
2. Click **Transcribe** button
3. Wait for processing (may take several minutes for long files)
4. View transcript when complete

### Search Files
- Use the search box to find files by name or content
- Filter by status (pending, completed, failed)
- Filter by linked client
- Results are paginated for performance

### Link to Clients
- Files can be linked to clients during upload
- Or link/unlink later by editing the file
- Linked files show client name in the file list

## 💰 Cost Estimation

### Google Cloud Speech-to-Text
- **Free Tier**: 60 minutes per month
- **Paid**: ~$0.024 per minute after free tier
- **Example**: 1-hour client interview = ~$1.44

### Supabase Storage
- **Free Tier**: 1GB storage
- **Paid**: $0.021 per GB per month
- **Example**: 100 hours of audio = ~$2-5/month

### Total Monthly Cost
- **Light Usage** (10 hours/month): ~$15-20
- **Moderate Usage** (50 hours/month): ~$60-80
- **Heavy Usage** (200 hours/month): ~$200-250

## 🔒 Security Features

### Data Protection
- Files stored in private Supabase Storage bucket
- Row Level Security (RLS) policies enforce access control
- Only staff, attorneys, and admins can access files
- Automatic cleanup prevents long-term storage of sensitive media

### Access Control
- Role-based permissions (admin, staff, attorney)
- No client access to media files (future feature)
- Secure API endpoints with authentication
- Google Cloud credentials stored securely

## 🚨 Troubleshooting

### Common Issues

#### "Google Cloud credentials not configured"
- Check that `GOOGLE_CLOUD_PROJECT_ID` is set
- Verify `GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON` contains valid JSON
- Ensure the service account has Speech-to-Text API access

#### "Failed to upload file"
- Check Supabase Storage bucket exists and is named `media-files`
- Verify storage policies are set correctly
- Ensure file size is under 2GB
- Check file format is supported

#### "Transcription failed"
- Verify Google Cloud billing is enabled
- Check Speech-to-Text API is enabled in your project
- Ensure the audio file is not corrupted
- Check file format is supported by Google Cloud

#### "File not found" errors
- Check that the file exists in Supabase Storage
- Verify storage policies allow access
- Ensure the file hasn't been manually deleted

### Debug Mode
Enable debug logging by checking browser console and server logs for detailed error messages.

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Storage Usage**: Check Supabase storage usage monthly
2. **Review Costs**: Monitor Google Cloud billing for unexpected charges
3. **Clean Up Failed Files**: Periodically delete files that failed transcription
4. **Update Policies**: Review and update RLS policies as needed

### Backup Strategy
- Transcripts are stored in the database (backed up with Supabase)
- Media files are in Supabase Storage (automatically backed up)
- Consider exporting important transcripts regularly

## 🚀 Next Steps

### Future Enhancements
1. **Client Portal Integration**: Allow clients to access their own files
2. **Bulk Upload**: Support multiple file uploads
3. **Advanced Search**: Full-text search within transcripts
4. **Export Options**: Download transcripts as PDF/Word documents
5. **Integration**: Link transcripts to specific cases/dockets
6. **Notifications**: Email alerts when transcription is complete

### Performance Optimization
1. **Caching**: Implement transcript caching for frequently accessed files
2. **Compression**: Optimize file storage with compression
3. **CDN**: Use CDN for faster file access
4. **Background Processing**: Move transcription to background jobs

---

## 📞 Support

If you encounter issues:
1. Check this setup guide first
2. Review the troubleshooting section
3. Check Google Cloud and Supabase logs
4. Verify all environment variables are set correctly
5. Test with a small audio file first

**Your media files and transcription system is now ready to use!** 🎉
