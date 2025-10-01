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
      .eq('id', user.id)
      .single();
    
    if (staffError || !staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 403 });
    }
    
    // Check if user has permission to run cleanup (admin only)
    if (staffUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Find files that are ready for cleanup (30 days after transcript completion)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: filesToCleanup, error: fetchError } = await supabase
      .from('media_files')
      .select('id, supabase_file_path, original_filename')
      .eq('transcription_status', 'completed')
      .not('transcript_completed_at', 'is', null)
      .lte('transcript_completed_at', thirtyDaysAgo.toISOString())
      .eq('media_file_deleted', false);
    
    if (fetchError) {
      console.error('Error fetching files for cleanup:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch files for cleanup' }, { status: 500 });
    }
    
    if (!filesToCleanup || filesToCleanup.length === 0) {
      return NextResponse.json({ 
        message: 'No files ready for cleanup',
        cleanedUp: 0
      });
    }
    
    let cleanedUpCount = 0;
    let errors: string[] = [];
    
    // Process each file for cleanup
    for (const file of filesToCleanup) {
      try {
        // Delete the file from Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('media-files')
          .remove([file.supabase_file_path]);
        
        if (storageError) {
          console.error(`Error deleting file ${file.id} from storage:`, storageError);
          errors.push(`Failed to delete ${file.original_filename}: ${storageError.message}`);
          continue;
        }
        
        // Update the database record to mark the file as deleted
        const { error: updateError } = await supabase
          .from('media_files')
          .update({ 
            media_file_deleted: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', file.id);
        
        if (updateError) {
          console.error(`Error updating file ${file.id} record:`, updateError);
          errors.push(`Failed to update record for ${file.original_filename}: ${updateError.message}`);
          continue;
        }
        
        cleanedUpCount++;
        console.log(`Successfully cleaned up file: ${file.original_filename}`);
        
      } catch (error) {
        console.error(`Error processing file ${file.id}:`, error);
        errors.push(`Error processing ${file.original_filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return NextResponse.json({ 
      message: `Cleanup completed. ${cleanedUpCount} files cleaned up.`,
      cleanedUp: cleanedUpCount,
      total: filesToCleanup.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error in POST /api/cleanup-media-files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      .eq('id', user.id)
      .single();
    
    if (staffError || !staffUser) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 403 });
    }
    
    // Check if user has permission to view cleanup info
    if (!['admin', 'staff', 'attorney'].includes(staffUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Find files that are ready for cleanup (30 days after transcript completion)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: filesToCleanup, error: fetchError } = await supabase
      .from('media_files')
      .select('id, original_filename, custom_filename, transcript_completed_at')
      .eq('transcription_status', 'completed')
      .not('transcript_completed_at', 'is', null)
      .lte('transcript_completed_at', thirtyDaysAgo.toISOString())
      .eq('media_file_deleted', false);
    
    if (fetchError) {
      console.error('Error fetching files for cleanup:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch files for cleanup' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      filesReadyForCleanup: filesToCleanup || [],
      count: filesToCleanup?.length || 0,
      cutoffDate: thirtyDaysAgo.toISOString()
    });
    
  } catch (error) {
    console.error('Error in GET /api/cleanup-media-files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
