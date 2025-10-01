import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the staff user record
    const { data: staffUser, error: staffError } = await supabase
      .from('staff_users')
      .select('id, role')
      .eq('email', user.email)
      .single();
    
    if (staffError || !staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 403 });
    }
    
    // Check if user has permission
    if (!['admin', 'staff', 'attorney'].includes(staffUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { mediaFileId } = body;
    
    if (!mediaFileId) {
      return NextResponse.json({ error: 'Media file ID required' }, { status: 400 });
    }

    // Get the media file record
    const { data: mediaFile, error: fileError } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', mediaFileId)
      .single();
    
    if (fileError || !mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    console.log('Testing GCS upload for file:', mediaFile.original_filename);

    try {
      // Generate signed URL for the file
      console.log('Generating signed URL...');
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('media-files')
        .createSignedUrl(mediaFile.supabase_file_path, 3600);
      
      if (urlError || !signedUrlData) {
        throw new Error(`Failed to generate signed URL: ${urlError?.message}`);
      }
      
      console.log('Signed URL generated successfully');

      // Test downloading the file
      console.log('Testing file download...');
      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      
      const fileBuffer = await response.arrayBuffer();
      console.log('File downloaded successfully, size:', fileBuffer.byteLength, 'bytes');

      // Test Google Cloud Storage client initialization
      console.log('Testing GCS client initialization...');
      const { Storage } = await import('@google-cloud/storage');
      
      const credentials = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      
      if (!credentials || !projectId) {
        throw new Error('Google Cloud credentials not configured');
      }
      
      const keyData = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
      const storage = new Storage({
        projectId,
        credentials: keyData,
      });
      
      console.log('GCS client initialized successfully');

      // Test bucket creation/access
      const bucketName = `${projectId}-temp-transcription`;
      console.log('Testing bucket access:', bucketName);
      
      const bucket = storage.bucket(bucketName);
      const [exists] = await bucket.exists();
      
      if (!exists) {
        console.log('Bucket does not exist, creating...');
        await bucket.create();
        console.log('Bucket created successfully');
      } else {
        console.log('Bucket exists');
      }

      return NextResponse.json({
        success: true,
        message: 'GCS upload test completed successfully',
        details: {
          fileInfo: {
            filename: mediaFile.original_filename,
            fileType: mediaFile.file_type,
            fileSize: mediaFile.file_size,
            downloadedSize: fileBuffer.byteLength
          },
          bucketInfo: {
            bucketName: bucketName,
            exists: exists
          }
        }
      });
      
    } catch (error) {
      console.error('GCS upload test error:', error);
      return NextResponse.json({
        success: false,
        error: 'GCS upload test failed',
        details: {
          error: error instanceof Error ? error.message : String(error),
          fileInfo: {
            filename: mediaFile.original_filename,
            fileType: mediaFile.file_type,
            fileSize: mediaFile.file_size
          }
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in test-gcs-upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
