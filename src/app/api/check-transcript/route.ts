import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    // Get the media file record
    const { data: mediaFile, error: fileError } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fileError || !mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      fileInfo: {
        id: mediaFile.id,
        filename: mediaFile.original_filename,
        status: mediaFile.transcription_status,
        transcript: mediaFile.transcript,
        transcriptLength: mediaFile.transcript ? mediaFile.transcript.length : 0,
        errorMessage: mediaFile.error_message,
        createdAt: mediaFile.created_at,
        transcribedAt: mediaFile.transcribed_at,
        completedAt: mediaFile.transcript_completed_at
      }
    });
    
  } catch (error) {
    console.error('Error in check-transcript:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
