import { SpeechClient } from '@google-cloud/speech';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud clients
let speechClient: SpeechClient | null = null;
let storageClient: Storage | null = null;

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

function getStorageClient(): Storage {
  if (!storageClient) {
    const credentials = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    
    if (!credentials || !projectId) {
      throw new Error('Google Cloud credentials not configured. Please set GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON and GOOGLE_CLOUD_PROJECT_ID environment variables.');
    }

    try {
      const keyData = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
      storageClient = new Storage({
        projectId,
        credentials: keyData,
      });
    } catch (error) {
      throw new Error(`Failed to initialize Google Cloud Storage client: ${error}`);
    }
  }
  return storageClient;
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
 * Download file from Supabase URL and upload to Google Cloud Storage temporarily
 */
async function uploadToGCS(supabaseUrl: string, filename: string): Promise<string> {
  const storage = getStorageClient();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
  const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || `${projectId}-media-files`;
  
  try {
    // Download file from Supabase
    const response = await fetch(supabaseUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file from Supabase: ${response.statusText}`);
    }
    
    const fileBuffer = await response.arrayBuffer();
    
    // Use the specified bucket (must exist)
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`Storage bucket '${bucketName}' does not exist. Please create it manually in Google Cloud Console. See GOOGLE-CLOUD-BUCKET-SETUP.md for instructions.`);
    }
    
    // Upload to GCS with unique filename
    const gcsFilename = `transcription-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${filename}`;
    const file = bucket.file(gcsFilename);
    
    await file.save(Buffer.from(fileBuffer));
    
    // Return GCS URI
    return `gs://${bucketName}/${gcsFilename}`;
  } catch (error) {
    throw new Error(`Failed to upload to GCS: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete temporary file from Google Cloud Storage
 */
async function deleteFromGCS(gcsUri: string): Promise<void> {
  try {
    const storage = getStorageClient();
    const [bucketName, filename] = gcsUri.replace('gs://', '').split('/', 2);
    const bucket = storage.bucket(bucketName);
    await bucket.file(filename).delete();
  } catch (error) {
    console.error('Failed to delete temporary file from GCS:', error);
    // Don't throw - this is cleanup, not critical
  }
}

/**
 * Transcribe audio from a Supabase URL by temporarily uploading to GCS
 */
export async function transcribeAudioFromSupabaseUrl(
  supabaseUrl: string,
  filename: string,
  config: Partial<TranscriptionConfig> = {}
): Promise<TranscriptionResult> {
  let gcsUri: string | null = null;
  
  try {
    // Upload to GCS temporarily
    console.log('Uploading file to Google Cloud Storage...');
    gcsUri = await uploadToGCS(supabaseUrl, filename);
    console.log('File uploaded to GCS:', gcsUri);
    
    // Transcribe from GCS URI
    const result = await transcribeAudioFromUrl(gcsUri, config);
    
    return result;
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      transcript: '',
      confidence: 0,
      languageCode: 'en-US',
      duration: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    // Clean up temporary file
    if (gcsUri) {
      console.log('Cleaning up temporary file:', gcsUri);
      await deleteFromGCS(gcsUri);
    }
  }
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
    encoding: 'LINEAR16', // More compatible with various formats
    sampleRateHertz: 16000, // Standard sample rate
    languageCode: 'en-US',
    enableSpeakerDiarization: false, // Disable for now to simplify
    diarizationSpeakerCount: 2,
    model: 'default', // Use default model for better compatibility
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
    console.log('Using config:', {
      encoding: defaultConfig.encoding,
      sampleRateHertz: defaultConfig.sampleRateHertz,
      languageCode: defaultConfig.languageCode,
      model: defaultConfig.model,
      useEnhanced: defaultConfig.useEnhanced
    });
    
    // Use recognize for shorter files, longRunningRecognize for longer files
    const [response] = await speechClient.longRunningRecognize(request);
    const [operation] = await response.promise();
    
    console.log('Google Cloud operation completed:', {
      hasResults: !!operation.results,
      resultsCount: operation.results?.length || 0,
      operationName: operation.name
    });
    
    if (!operation.results || operation.results.length === 0) {
      console.log('No transcription results - this could mean:');
      console.log('1. Audio is too quiet or silent');
      console.log('2. Audio format is not supported');
      console.log('3. Audio is corrupted');
      console.log('4. Wrong encoding settings');
      
      return {
        transcript: '',
        confidence: 0,
        languageCode: defaultConfig.languageCode,
        duration: 0,
        error: 'No transcription results returned - audio may be silent, corrupted, or in unsupported format'
      };
    }

    // Combine all results into a single transcript
    let fullTranscript = '';
    let totalConfidence = 0;
    let resultCount = 0;

    for (const result of operation.results) {
      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0];
        if (alternative.transcript) {
          fullTranscript += alternative.transcript + ' ';
          totalConfidence += alternative.confidence || 0;
          resultCount++;
        }
      }
    }

    const averageConfidence = resultCount > 0 ? totalConfidence / resultCount : 0;

    console.log('Transcription completed successfully');
    return {
      transcript: fullTranscript.trim(),
      confidence: averageConfidence,
      languageCode: defaultConfig.languageCode,
      duration: 0, // Duration will be calculated separately
      speakerCount: undefined // Speaker diarization temporarily disabled due to TypeScript issues
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
  const maxSizeBytes = 4 * 1024 * 1024; // 4MB - Vercel free plan limit (4.5MB with buffer)
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
    return { valid: false, error: 'File size exceeds 4MB limit (Vercel free plan)' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported file format' };
  }

  return { valid: true };
}

