import { SpeechClient } from '@google-cloud/speech';

// Initialize Google Cloud clients
let speechClient: SpeechClient | null = null;

function getSpeechClient(): SpeechClient {
  if (!speechClient) {
    const credentials = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    
    if (!credentials || !projectId) {
      throw new Error('Google Cloud credentials not configured. Please set GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON and GOOGLE_CLOUD_PROJECT_ID environment variables.');
    }

    try {
      const keyData = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
      speechClient = new SpeechClient({
        projectId,
        credentials: keyData,
      });
    } catch (error) {
      throw new Error(`Failed to initialize Google Cloud Speech client: ${error}`);
    }
  }
  return speechClient;
}


export interface TranscriptionConfig {
  encoding: 'WEBM_OPUS' | 'FLAC' | 'LINEAR16' | 'MP3' | 'OGG_OPUS' | 'MULAW';
  sampleRateHertz: number;
  languageCode: string;
  enableSpeakerDiarization?: boolean;
  diarizationSpeakerCount?: number;
  model?: 'latest_long' | 'latest_short' | 'phone_call' | 'video' | 'default';
  useEnhanced?: boolean;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  languageCode: string;
  duration: number;
  speakerCount?: number;
  error?: string;
}

/**
 * Transcribe audio from a URL using Google Cloud Speech-to-Text
 */
export async function transcribeAudioFromUrl(
  audioUrl: string,
  config: Partial<TranscriptionConfig> = {}
): Promise<TranscriptionResult> {
  const speechClient = getSpeechClient();
  
  // Default configuration optimized for legal audio/video
  const defaultConfig: TranscriptionConfig = {
    encoding: 'WEBM_OPUS',
    sampleRateHertz: 48000,
    languageCode: 'en-US',
    enableSpeakerDiarization: true,
    diarizationSpeakerCount: 2,
    model: 'phone_call', // Good for legal conversations
    useEnhanced: true,
    ...config
  };

  try {
    const request = {
      audio: {
        uri: audioUrl,
      },
      config: {
        encoding: defaultConfig.encoding,
        sampleRateHertz: defaultConfig.sampleRateHertz,
        languageCode: defaultConfig.languageCode,
        enableSpeakerDiarization: defaultConfig.enableSpeakerDiarization,
        diarizationSpeakerCount: defaultConfig.diarizationSpeakerCount,
        model: defaultConfig.model,
        useEnhanced: defaultConfig.useEnhanced,
        // Add legal-specific vocabulary if needed
        speechContexts: [{
          phrases: [
            'court', 'judge', 'attorney', 'lawyer', 'defendant', 'plaintiff',
            'deposition', 'testimony', 'evidence', 'objection', 'sustained',
            'overruled', 'guilty', 'not guilty', 'plea', 'bail', 'sentencing',
            'probation', 'parole', 'appeal', 'motion', 'hearing', 'trial',
            'jury', 'verdict', 'subpoena', 'warrant', 'arrest', 'charge',
            'indictment', 'arraignment', 'preliminary hearing', 'discovery',
            'settlement', 'mediation', 'arbitration', 'litigation', 'lawsuit'
          ],
          boost: 20.0
        }]
      },
    };

    console.log('Starting transcription for:', audioUrl);
    
    // Use recognize for shorter files, longRunningRecognize for longer files
    const [response] = await speechClient.longRunningRecognize(request);
    const [operation] = await response.promise();
    
    if (!operation.results || operation.results.length === 0) {
      return {
        transcript: '',
        confidence: 0,
        languageCode: defaultConfig.languageCode,
        duration: 0,
        error: 'No transcription results returned'
      };
    }

    // Combine all results into a single transcript
    let fullTranscript = '';
    let totalConfidence = 0;
    let resultCount = 0;
    let speakerCount = 0;

    for (const result of operation.results) {
      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0];
        if (alternative.transcript) {
          fullTranscript += alternative.transcript + ' ';
          totalConfidence += alternative.confidence || 0;
          resultCount++;
        }
      }

      // Count speakers if diarization is enabled
      if (result.words) {
        const speakers = new Set(result.words.map(word => word.speakerTag || 0));
        speakerCount = Math.max(speakerCount, speakers.size);
      }
    }

    const averageConfidence = resultCount > 0 ? totalConfidence / resultCount : 0;

    console.log('Transcription completed successfully');
    return {
      transcript: fullTranscript.trim(),
      confidence: averageConfidence,
      languageCode: defaultConfig.languageCode,
      duration: 0, // Duration will be calculated separately
      speakerCount: speakerCount > 0 ? speakerCount : undefined
    };

  } catch (error) {
    console.error('Transcription error:', error);
    return {
      transcript: '',
      confidence: 0,
      languageCode: defaultConfig.languageCode,
      duration: 0,
      error: error instanceof Error ? error.message : 'Unknown transcription error'
    };
  }
}

/**
 * Get file duration in seconds (placeholder - would need actual implementation)
 */
export async function getAudioDuration(audioUrl: string): Promise<number> {
  // This is a placeholder - in a real implementation, you'd use a library like ffprobe
  // or extract duration from the file metadata
  // For now, we'll estimate based on file size (very rough approximation)
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      // Rough estimate: 1MB ≈ 1 minute of audio
      return Math.round(parseInt(contentLength) / (1024 * 1024));
    }
    return 0;
  } catch (error) {
    console.error('Error getting audio duration:', error);
    return 0;
  }
}

/**
 * Validate audio file format and size
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const maxSizeBytes = 2 * 1024 * 1024 * 1024; // 2GB
  const allowedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/flac',
    'audio/m4a',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov'
  ];

  if (file.size > maxSizeBytes) {
    return { valid: false, error: 'File size exceeds 2GB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported file format' };
  }

  return { valid: true };
}

