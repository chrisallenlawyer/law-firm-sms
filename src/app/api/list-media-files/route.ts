import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Get recent media files
    const { data: mediaFiles, error } = await supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching media files:', error);
      return NextResponse.json({ error: 'Failed to fetch media files' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mediaFiles: mediaFiles?.map(file => ({
        id: file.id,
        original_filename: file.original_filename,
        file_type: file.file_type,
        file_size: file.file_size,
        transcription_status: file.transcription_status,
        error_message: file.error_message,
        created_at: file.created_at
      })) || []
    });
    
  } catch (error) {
    console.error('Error in list-media-files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
