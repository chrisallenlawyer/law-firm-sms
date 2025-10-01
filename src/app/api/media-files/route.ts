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
      .eq('id', user.id)
      .single();
    
    if (staffError || !staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 403 });
    }
    
    // Check if user has permission to upload files
    if (!['admin', 'staff', 'attorney'].includes(staffUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customFilename = formData.get('customFilename') as string;
    const clientId = formData.get('clientId') as string;
    const caseNumber = formData.get('caseNumber') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    // Generate filename with date/time
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileExtension = file.name.split('.').pop();
    const baseFilename = `${dateStr}_${Math.random().toString(36).substr(2, 9)}`;
    const finalFilename = customFilename 
      ? `${dateStr}_${customFilename.replace(/[^a-zA-Z0-9-_]/g, '_')}_${baseFilename}.${fileExtension}`
      : `${baseFilename}.${fileExtension}`;
    
    // Determine file type
    const fileType = file.type.startsWith('video/') ? 'video' : 'audio';
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-files')
      .upload(finalFilename, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
    
    // Create database record
    const { data: mediaFile, error: dbError } = await supabase
      .from('media_files')
      .insert({
        original_filename: file.name,
        supabase_file_path: uploadData.path,
        file_type: fileType,
        file_size: file.size,
        custom_filename: customFilename || null,
        client_id: clientId || null,
        case_number: caseNumber || null,
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
      await supabase.storage.from('media-files').remove([uploadData.path]);
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
