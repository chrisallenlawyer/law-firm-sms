import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudioFromUrl, getAudioDuration } from '@/lib/google-cloud';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: mediaFileId } = await params;
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the staff user record
    const { data: staffUser, error: staffError } = await supabase
      .from('staff_users')
      .select('id, role')
      .eq('id', user.id)
      .single();
    
    if (staffError || !staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 403 });
    }
    
    // Check if user has permission to transcribe files
    if (!['admin', 'staff', 'attorney'].includes(staffUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
    
    // Check if file is already being processed or completed
    if (mediaFile.transcription_status === 'processing') {
      return NextResponse.json({ error: 'Transcription already in progress' }, { status: 409 });
    }
    
    if (mediaFile.transcription_status === 'completed') {
      return NextResponse.json({ error: 'Transcription already completed' }, { status: 409 });
    }
    
    // Check if media file still exists
    if (mediaFile.media_file_deleted) {
      return NextResponse.json({ error: 'Media file has been deleted' }, { status: 410 });
    }
    
    // Update status to processing
    const { error: updateError } = await supabase
      .from('media_files')
      .update({ 
        transcription_status: 'processing',
        error_message: null
      })
      .eq('id', mediaFileId);
    
    if (updateError) {
      console.error('Error updating status:', updateError);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
    
    try {
      // Generate signed URL for the file
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('media-files')
        .createSignedUrl(mediaFile.supabase_file_path, 3600); // 1 hour expiry
      
      if (urlError || !signedUrlData) {
        throw new Error('Failed to generate signed URL');
      }
      
      // Get file duration
      const duration = await getAudioDuration(signedUrlData.signedUrl);
      
      // Transcribe the audio
      const transcriptionResult = await transcribeAudioFromUrl(signedUrlData.signedUrl, {
        // Configure based on file type
        model: mediaFile.file_type === 'video' ? 'video' : 'phone_call',
        enableSpeakerDiarization: true,
        diarizationSpeakerCount: 2,
      });
      
      if (transcriptionResult.error) {
        // Update status to failed with error message
        await supabase
          .from('media_files')
          .update({ 
            transcription_status: 'failed',
            error_message: transcriptionResult.error,
            transcribed_at: new Date().toISOString()
          })
          .eq('id', mediaFileId);
        
        return NextResponse.json({ 
          error: 'Transcription failed',
          details: transcriptionResult.error 
        }, { status: 500 });
      }
      
      // Update with successful transcription
      const { error: successError } = await supabase
        .from('media_files')
        .update({ 
          transcript: transcriptionResult.transcript,
          transcription_status: 'completed',
          transcribed_at: new Date().toISOString(),
          transcript_completed_at: new Date().toISOString(),
          duration_seconds: duration,
          error_message: null
        })
        .eq('id', mediaFileId);
      
      if (successError) {
        console.error('Error saving transcription:', successError);
        return NextResponse.json({ error: 'Failed to save transcription' }, { status: 500 });
      }
      
      // Get the updated record
      const { data: updatedFile, error: fetchError } = await supabase
        .from('media_files')
        .select(`
          *,
          client:clients (id, first_name, last_name),
          uploaded_by_user:staff_users (id, name, email)
        `)
        .eq('id', mediaFileId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching updated file:', fetchError);
      }
      
      return NextResponse.json({ 
        message: 'Transcription completed successfully',
        mediaFile: updatedFile,
        transcriptionResult: {
          transcript: transcriptionResult.transcript,
          confidence: transcriptionResult.confidence,
          speakerCount: transcriptionResult.speakerCount,
          duration: duration
        }
      });
      
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      
      // Update status to failed
      await supabase
        .from('media_files')
        .update({ 
          transcription_status: 'failed',
          error_message: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown transcription error',
          transcribed_at: new Date().toISOString()
        })
        .eq('id', mediaFileId);
      
      return NextResponse.json({ 
        error: 'Transcription failed',
        details: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in POST /api/media-files/[id]/transcribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
