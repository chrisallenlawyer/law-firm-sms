import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudioFromSupabaseUrl, getAudioDuration } from '@/lib/google-cloud';

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

    console.log('Testing transcription for file:', mediaFile.original_filename);
    console.log('File path:', mediaFile.supabase_file_path);
    console.log('File type:', mediaFile.file_type);

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
      console.log('URL length:', signedUrlData.signedUrl.length);

      // Test getting file duration
      console.log('Getting audio duration...');
      const duration = await getAudioDuration(signedUrlData.signedUrl);
      console.log('Duration:', duration, 'seconds');

      // Test transcription with detailed logging
      console.log('Starting transcription...');
      const transcriptionResult = await transcribeAudioFromSupabaseUrl(
        signedUrlData.signedUrl,
        mediaFile.original_filename,
        {
          model: mediaFile.file_type === 'video' ? 'video' : 'phone_call',
          enableSpeakerDiarization: true,
          diarizationSpeakerCount: 2,
        }
      );
      
      console.log('Transcription result:', {
        hasError: !!transcriptionResult.error,
        errorMessage: transcriptionResult.error,
        transcriptLength: transcriptionResult.transcript?.length || 0,
        confidence: transcriptionResult.confidence
      });

      if (transcriptionResult.error) {
        return NextResponse.json({
          success: false,
          error: 'Transcription failed',
          details: {
            error: transcriptionResult.error,
            fileInfo: {
              filename: mediaFile.original_filename,
              fileType: mediaFile.file_type,
              fileSize: mediaFile.file_size,
              duration: duration
            }
          }
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Transcription test completed successfully',
        details: {
          transcript: transcriptionResult.transcript,
          confidence: transcriptionResult.confidence,
          duration: duration,
          fileInfo: {
            filename: mediaFile.original_filename,
            fileType: mediaFile.file_type,
            fileSize: mediaFile.file_size
          }
        }
      });
      
    } catch (error) {
      console.error('Transcription test error:', error);
      return NextResponse.json({
        success: false,
        error: 'Transcription test failed',
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
    console.error('Error in test-transcription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
