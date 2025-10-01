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

    // Test Google Cloud configuration
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const credentials = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;
    
    if (!projectId || !credentials) {
      return NextResponse.json({
        error: 'Google Cloud credentials not configured',
        details: {
          hasProjectId: !!projectId,
          hasCredentials: !!credentials
        }
      }, { status: 500 });
    }

    try {
      // Test parsing the credentials JSON
      const keyData = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
      
      // Test importing Google Cloud Speech client
      const { SpeechClient } = await import('@google-cloud/speech');
      
      // Try to create a client (this will fail if credentials are invalid)
      new SpeechClient({
        projectId,
        credentials: keyData,
      });

      return NextResponse.json({
        success: true,
        message: 'Google Cloud Speech-to-Text API is properly configured',
        details: {
          projectId: projectId,
          hasValidCredentials: true,
          clientCreated: true
        }
      });
      
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to initialize Google Cloud Speech client',
        details: {
          error: error instanceof Error ? error.message : String(error),
          projectId: projectId,
          hasCredentials: !!credentials
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in test-google-cloud:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
