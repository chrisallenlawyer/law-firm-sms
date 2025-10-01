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

    console.log(`Debugging audio file: ${mediaFile.original_filename}`);

    // Try more specific configurations for .m4a files
    const debugTests = [
      {
        name: 'LINEAR16, 16kHz (original)',
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
        name: 'LINEAR16, 48kHz',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          model: 'default' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'LINEAR16, 22kHz',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 22050,
          languageCode: 'en-US',
          model: 'default' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'LINEAR16, 8kHz (phone quality)',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 8000,
          languageCode: 'en-US',
          model: 'phone_call' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'LINEAR16, 44.1kHz with phone_call model',
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
        name: 'LINEAR16, 44.1kHz with video model',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'video' as const,
          useEnhanced: true,
          enableSpeakerDiarization: false
        }
      },
      {
        name: 'LINEAR16, 44.1kHz with enhanced=false',
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
        name: 'LINEAR16, 44.1kHz with speaker diarization',
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 44100,
          languageCode: 'en-US',
          model: 'phone_call' as const,
          useEnhanced: true,
          enableSpeakerDiarization: true,
          diarizationSpeakerCount: 2
        }
      }
    ];

    const results = [];

    for (const test of debugTests) {
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
          hasMeaningfulContent: result.transcript && result.transcript.length > 10 && !result.transcript.includes('and and')
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

    // Find the best meaningful result
    const meaningfulResults = results.filter(r => r.success && r.hasMeaningfulContent);
    const successfulResults = results.filter(r => r.success);
    const bestResult = meaningfulResults.length > 0 
      ? meaningfulResults.reduce((best, current) => (current.confidence || 0) > (best.confidence || 0) ? current : best)
      : successfulResults.reduce((best, current) => (current.confidence || 0) > (best.confidence || 0) ? current : best);

    return NextResponse.json({
      success: true,
      message: 'Audio debugging completed',
      fileInfo: {
        id: mediaFile.id,
        filename: mediaFile.original_filename,
        fileType: mediaFile.file_type,
        fileSize: mediaFile.file_size
      },
      results,
      bestResult: bestResult ? {
        config: bestResult.config,
        transcript: bestResult.transcript,
        confidence: bestResult.confidence,
        hasMeaningfulContent: bestResult.hasMeaningfulContent
      } : null,
      meaningfulResultsCount: meaningfulResults.length
    });

  } catch (error) {
    console.error('Error in POST /api/debug-audio:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
