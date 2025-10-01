import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudioFromSupabaseUrl } from '@/lib/google-cloud';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the staff user record
    const { data: staffUser, error: staffError } = await supabase
      .from('staff_users')
      .select('id, role, email')
      .eq('email', user.email)
      .single();

    if (staffError || !staffUser) {
      return NextResponse.json({ success: false, error: 'Staff user not found' }, { status: 403 });
    }

    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ success: false, error: 'File ID is required' }, { status: 400 });
    }

    // Fetch the media file record
    const { data: mediaFile, error: fetchError } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError || !mediaFile) {
      return NextResponse.json({ success: false, error: 'Media file not found' }, { status: 404 });
    }

    // Get signed URL for the file
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('media-files')
      .createSignedUrl(mediaFile.supabase_file_path, 3600);

    if (urlError || !signedUrlData) {
      return NextResponse.json({ success: false, error: 'Failed to get file URL' }, { status: 500 });
    }

    console.log(`Force re-transcribing: ${mediaFile.original_filename}`);

    // Reset transcription status to allow re-transcription
    const { error: updateError } = await supabase
      .from('media_files')
      .update({
        transcription_status: 'pending',
        transcript: null,
        error_message: null,
        transcribed_at: null,
        transcript_completed_at: null
      })
      .eq('id', fileId);

    if (updateError) {
      console.error('Failed to reset transcription status:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to reset transcription status' }, { status: 500 });
    }

    // Now transcribe with improved settings
    const transcriptionResult = await transcribeAudioFromSupabaseUrl(
      signedUrlData.signedUrl,
      mediaFile.original_filename,
      {
        model: 'phone_call',
        encoding: 'MP3',
        sampleRateHertz: 44100,
        enableSpeakerDiarization: false
      }
    );

    // Update the database with the new transcription
    const { error: dbError } = await supabase
      .from('media_files')
      .update({
        transcript: transcriptionResult.transcript,
        transcription_status: transcriptionResult.transcript ? 'completed' : 'failed',
        error_message: transcriptionResult.error || null,
        transcribed_at: new Date().toISOString(),
        transcript_completed_at: transcriptionResult.transcript ? new Date().toISOString() : null,
        cleanup_scheduled_at: transcriptionResult.transcript ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
      })
      .eq('id', fileId);

    if (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json({ success: false, error: 'Failed to save transcription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'File re-transcribed successfully',
      transcript: transcriptionResult.transcript,
      confidence: transcriptionResult.confidence,
      duration: transcriptionResult.duration,
      error: transcriptionResult.error
    });

  } catch (error) {
    console.error('Error in POST /api/force-retranscribe:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
