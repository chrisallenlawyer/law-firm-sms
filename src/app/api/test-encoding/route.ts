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

    console.log(`Testing different encodings for: ${mediaFile.original_filename}`);

    // Test different encoding configurations for .m4a files
    const encodingTests = [
      {
        name: 'AUTO (let Google detect)',
        config: {
          encoding: 'WEBM_OPUS' as any, // This will be overridden to let Google auto-detect
          sampleRateHertz: 0, // Let Google auto-detect
          languageCode: 'en-US',
          model: 'default' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'AAC (common for .m4a)',
        config: {
          encoding: 'AAC' as any,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'phone_call' as const,
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
          model: 'phone_call' as const,
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
          model: 'phone_call' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'LINEAR16, 44.1kHz',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'phone_call' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'OGG_OPUS',
        config: {
          encoding: 'OGG_OPUS' as const,
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          model: 'phone_call' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      }
    ];

    const results = [];

    for (const test of encodingTests) {
      try {
        console.log(`Testing encoding: ${test.name}`);
        
        // Special handling for auto-detection
        let config = { ...test.config };
        if (test.name.includes('AUTO')) {
          // Create new config without encoding and sample rate to let Google auto-detect
          const { encoding, sampleRateHertz, ...autoConfig } = test.config;
          config = autoConfig as any;
        }
        
        const result = await transcribeAudioFromSupabaseUrl(
          signedUrlData.signedUrl,
          mediaFile.original_filename,
          config
        );

        results.push({
          encoding: test.name,
          success: true,
          transcript: result.transcript,
          confidence: result.confidence,
          duration: result.duration,
          error: result.error || null,
          transcriptLength: result.transcript?.length || 0
        });

        console.log(`✅ ${test.name}: "${result.transcript.substring(0, 100)}..." (${result.transcript.length} chars)`);
        
        // If we get a good result, break early
        if (result.transcript && result.transcript.length > 10 && result.confidence > 0.5) {
          console.log(`🎯 Found good result with ${test.name}, stopping tests`);
          break;
        }
        
      } catch (error) {
        console.log(`❌ ${test.name}: ${error instanceof Error ? error.message : String(error)}`);
        
        results.push({
          encoding: test.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Encoding tests completed',
      fileInfo: {
        id: mediaFile.id,
        filename: mediaFile.original_filename,
        fileType: mediaFile.file_type,
        fileSize: mediaFile.file_size
      },
      results
    });

  } catch (error) {
    console.error('Error in POST /api/test-encoding:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
