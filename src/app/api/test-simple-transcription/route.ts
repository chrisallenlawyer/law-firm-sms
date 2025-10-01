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

    console.log(`Testing simple transcription for: ${mediaFile.original_filename}`);

    // Test with minimal configuration - no custom speech contexts
    const simpleConfigs = [
      {
        name: 'Minimal Config (no speech contexts)',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'default' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false,
          // Explicitly no speechContexts
          speechContexts: []
        }
      },
      {
        name: 'Basic Config (no enhanced)',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'default' as const,
          useEnhanced: false,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'Phone Call Model (no speech contexts)',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'phone_call' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false,
          speechContexts: []
        }
      },
      {
        name: 'Video Model (no speech contexts)',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'video' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false,
          speechContexts: []
        }
      },
      {
        name: 'Auto-detect encoding (no speech contexts)',
        config: {
          // No encoding specified - let Google auto-detect
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'default' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false,
          speechContexts: []
        }
      }
    ];

    const results = [];

    for (const test of simpleConfigs) {
      try {
        console.log(`Testing: ${test.name}`);
        
        const result = await transcribeAudioFromSupabaseUrl(
          signedUrlData.signedUrl,
          mediaFile.original_filename,
          test.config
        );

        results.push({
          config: test.name,
          success: true,
          transcript: result.transcript,
          confidence: result.confidence,
          duration: result.duration,
          error: result.error || null,
          transcriptLength: result.transcript?.length || 0,
          isMeaningful: result.transcript && result.transcript.length > 20 && !result.transcript.includes('and and')
        });

        console.log(`✅ ${test.name}: "${result.transcript}" (${result.transcript.length} chars, confidence: ${result.confidence})`);
        
      } catch (error) {
        console.log(`❌ ${test.name}: ${error instanceof Error ? error.message : String(error)}`);
        
        results.push({
          config: test.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Find meaningful results
    const meaningfulResults = results.filter(r => r.success && r.isMeaningful);
    const bestResult = results.filter(r => r.success).reduce((best, current) => 
      current.confidence > best.confidence ? current : best, results[0] || {});

    return NextResponse.json({
      success: true,
      message: 'Simple transcription tests completed',
      fileInfo: {
        id: mediaFile.id,
        filename: mediaFile.original_filename,
        fileType: mediaFile.file_type,
        fileSize: mediaFile.file_size
      },
      results,
      meaningfulResults,
      bestResult: bestResult.success ? {
        config: bestResult.config,
        transcript: bestResult.transcript,
        confidence: bestResult.confidence,
        isMeaningful: bestResult.isMeaningful
      } : null,
      meaningfulCount: meaningfulResults.length
    });

  } catch (error) {
    console.error('Error in POST /api/test-simple-transcription:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
