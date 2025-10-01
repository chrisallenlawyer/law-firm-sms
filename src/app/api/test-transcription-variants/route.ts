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

    console.log(`Testing transcription variants for: ${mediaFile.original_filename}`);

    // Test different transcription configurations
    const variants = [
      {
        name: 'Default (LINEAR16, 16kHz)',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          model: 'default' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'FLAC, 44.1kHz',
        config: {
          encoding: 'FLAC' as const,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'default' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'MP3, 44.1kHz',
        config: {
          encoding: 'MP3' as const,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'default' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'Enhanced Model',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          model: 'phone_call' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'Video Model',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          model: 'video' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      }
    ];

    const results = [];

    for (const variant of variants) {
      try {
        console.log(`Testing variant: ${variant.name}`);
        
        const result = await transcribeAudioFromSupabaseUrl(
          signedUrlData.signedUrl,
          mediaFile.original_filename,
          variant.config
        );

        results.push({
          variant: variant.name,
          success: true,
          transcript: result.transcript,
          confidence: result.confidence,
          duration: result.duration,
          error: result.error || null
        });

        console.log(`✅ ${variant.name}: "${result.transcript.substring(0, 100)}..."`);
        
      } catch (error) {
        console.log(`❌ ${variant.name}: ${error instanceof Error ? error.message : String(error)}`);
        
        results.push({
          variant: variant.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transcription variants tested',
      fileInfo: {
        id: mediaFile.id,
        filename: mediaFile.original_filename,
        fileType: mediaFile.file_type,
        fileSize: mediaFile.file_size
      },
      results
    });

  } catch (error) {
    console.error('Error in POST /api/test-transcription-variants:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
