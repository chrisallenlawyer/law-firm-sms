# Google Cloud Storage Bucket Setup

## Problem
The transcription feature needs a Google Cloud Storage bucket to temporarily store files for transcription. The service account doesn't have permission to create buckets automatically.

## Solution: Create Bucket Manually

### Step 1: Create the Storage Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **law-firm-transcriptions**
3. Navigate to **Cloud Storage** → **Buckets**
4. Click **"Create Bucket"**
5. Configure the bucket:
   - **Name**: `law-firm-transcriptions-media-files`
   - **Location**: Choose the same region as your project (e.g., us-central1)
   - **Storage class**: Standard
   - **Access control**: Fine-grained
   - **Protection tools**: None (for now)
6. Click **"Create"**

### Step 2: Grant Service Account Access

1. Go to **Cloud Storage** → **Buckets**
2. Click on your bucket: `law-firm-transcriptions-media-files`
3. Click **"Permissions"** tab
4. Click **"Grant Access"**
5. Add principal: `law-firm-transcriptions@law-firm-transcriptions.iam.gserviceaccount.com`
6. Role: **Storage Object Admin**
7. Click **"Save"**

### Step 3: Alternative - Grant Project-Level Permissions

If you prefer to grant broader permissions:

1. Go to **IAM & Admin** → **IAM**
2. Find your service account: `law-firm-transcriptions@law-firm-transcriptions.iam.gserviceaccount.com`
3. Click **Edit** (pencil icon)
4. Add role: **Storage Admin**
5. Click **"Save"**

## Verification

After completing the setup, test the transcription again. The system will:
1. Download your file from Supabase
2. Upload it temporarily to the GCS bucket
3. Transcribe it using Google Cloud Speech-to-Text
4. Delete the temporary file
5. Save the transcript to your database

## Bucket Name

The system will look for a bucket named: `law-firm-transcriptions-media-files`

If you create a bucket with a different name, update the environment variable:
```
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
```
