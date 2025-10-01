import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAudioFile } from '@/lib/google-cloud';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    
    const offset = (page - 1) * limit;
    
    // Build query for count
    let countQuery = supabase
      .from('media_files')
      .select('*', { count: 'exact', head: true });
    
    // Apply filters to count query
    if (search) {
      countQuery = countQuery.or(`original_filename.ilike.%${search}%,custom_filename.ilike.%${search}%,transcript.ilike.%${search}%,case_number.ilike.%${search}%`);
    }
    
    if (clientId) {
      countQuery = countQuery.eq('client_id', clientId);
    }
    
    if (status) {
      countQuery = countQuery.eq('transcription_status', status);
    }
    
    // Get total count for pagination
    const { count } = await countQuery;
    
    // Build full query with relations and pagination
    let fullQuery = supabase
      .from('media_files')
      .select(`
        *,
        client:clients (id, first_name, last_name),
        uploaded_by_user:staff_users (id, name, email)
      `)
      .order('created_at', { ascending: false });
    
    // Apply same filters to full query
    if (search) {
      fullQuery = fullQuery.or(`original_filename.ilike.%${search}%,custom_filename.ilike.%${search}%,transcript.ilike.%${search}%,case_number.ilike.%${search}%`);
    }
    
    if (clientId) {
      fullQuery = fullQuery.eq('client_id', clientId);
    }
    
    if (status) {
      fullQuery = fullQuery.eq('transcription_status', status);
    }
    
    // Get paginated results
    const { data: mediaFiles, error } = await fullQuery
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching media files:', error);
      return NextResponse.json({ error: 'Failed to fetch media files' }, { status: 500 });
    }
    
    return NextResponse.json({
      mediaFiles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/media-files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    
    // Check if user has permission to upload files
    if (!['admin', 'staff', 'attorney'].includes(staffUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const body = await request.json();
    const { 
      original_filename, 
      supabase_file_path, 
      file_type, 
      file_size, 
      custom_filename, 
      client_id, 
      case_number 
    } = body;
    
    if (!original_filename || !supabase_file_path || !file_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create database record
    const { data: mediaFile, error: dbError } = await supabase
      .from('media_files')
      .insert({
        original_filename,
        supabase_file_path,
        file_type,
        file_size: file_size || null,
        custom_filename: custom_filename || null,
        client_id: client_id || null,
        case_number: case_number || null,
        uploaded_by: staffUser.id,
        transcription_status: 'pending'
      })
      .select(`
        *,
        client:clients (id, first_name, last_name),
        uploaded_by_user:staff_users (id, name, email)
      `)
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('media-files').remove([supabase_file_path]);
      return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'File uploaded successfully',
      mediaFile 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/media-files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
