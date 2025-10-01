import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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
    
    // Check if user has permission to view files
    if (!['admin', 'staff', 'attorney'].includes(staffUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get the media file
    const { data: mediaFile, error: fileError } = await supabase
      .from('media_files')
      .select(`
        *,
        client:clients (id, first_name, last_name),
        uploaded_by_user:staff_users (id, name, email)
      `)
      .eq('id', mediaFileId)
      .single();
    
    if (fileError || !mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }
    
    return NextResponse.json({ mediaFile });
    
  } catch (error) {
    console.error('Error in GET /api/media-files/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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
    
    // Check if user has permission to update files
    if (!['admin', 'staff', 'attorney'].includes(staffUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const body = await request.json();
    const { customFilename, clientId, caseNumber } = body;
    
    // Update the media file
    const { data: mediaFile, error: updateError } = await supabase
      .from('media_files')
      .update({
        custom_filename: customFilename || null,
        client_id: clientId || null,
        case_number: caseNumber || null,
      })
      .eq('id', mediaFileId)
      .select(`
        *,
        client:clients (id, first_name, last_name),
        uploaded_by_user:staff_users (id, name, email)
      `)
      .single();
    
    if (updateError) {
      console.error('Error updating media file:', updateError);
      return NextResponse.json({ error: 'Failed to update media file' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Media file updated successfully',
      mediaFile 
    });
    
  } catch (error) {
    console.error('Error in PUT /api/media-files/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    
    // Check if user has permission to delete files
    if (!['admin', 'staff', 'attorney'].includes(staffUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get the media file first
    const { data: mediaFile, error: fileError } = await supabase
      .from('media_files')
      .select('supabase_file_path, media_file_deleted')
      .eq('id', mediaFileId)
      .single();
    
    if (fileError || !mediaFile) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }
    
    // Delete the file from storage if it hasn't been deleted already
    if (!mediaFile.media_file_deleted) {
      const { error: storageError } = await supabase.storage
        .from('media-files')
        .remove([mediaFile.supabase_file_path]);
      
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Delete the database record
    const { error: deleteError } = await supabase
      .from('media_files')
      .delete()
      .eq('id', mediaFileId);
    
    if (deleteError) {
      console.error('Error deleting media file record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete media file' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Media file deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/media-files/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
