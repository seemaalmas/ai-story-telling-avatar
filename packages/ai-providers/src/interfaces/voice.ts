import { Readable } from 'stream';

// ─── Speech-to-Text (STT) ──────────────────────────────────

export interface STTInput {
  /** Audio data as a Buffer or readable stream */
  audio: Buffer | Readable;
  /** Audio format of the input */
  format: 'wav' | 'mp3' | 'ogg' | 'webm' | 'flac';
  /** BCP-47 language hint (e.g. 'hi-IN', 'en-IN', 'ta-IN') */
  languageCode: string;
  /** Sample rate in Hz (required for raw PCM) */
  sampleRateHz?: number;
  /** Enable word-level timing */
  enableWordTimestamps?: boolean;
  /** Enable automatic punctuation */
  enablePunctuation?: boolean;
}

export interface STTWordTiming {
  word: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface STTOutput {
  /** Full transcript text */
  transcript: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Detected language code */
  detectedLanguage?: string;
  /** Word-level timing when enableWordTimestamps is true */
  wordTimings?: STTWordTiming[];
  /** Provider-specific metadata */
  meta?: {
    model: string;
    processingMs: number;
    audioDurationMs: number;
  };
}

/**
 * STT provider interface.
 * Implement for Google STT, Deepgram, Whisper, Azure, etc.
 */
export interface STTProvider {
  readonly name: string;

  /** Transcribe a complete audio buffer */
  transcribe(input: STTInput): Promise<STTOutput>;

  /**
   * Streaming transcription.
   * Write audio chunks to the returned writable; read transcripts from readable.
   * Call end() when done sending audio.
   */
  transcribeStream?(input: Omit<STTInput, 'audio'>): {
    write(chunk: Buffer): void;
    end(): void;
    onPartial(cb: (partial: string) => void): void;
    onFinal(cb: (result: STTOutput) => void): void;
    onError(cb: (err: Error) => void): void;
  };

  healthCheck(): Promise<boolean>;
}

// ─── Text-to-Speech (TTS) ──────────────────────────────────

export interface TTSInput {
  /** Text to synthesize */
  text: string;
  /** BCP-47 language code */
  languageCode: string;
  /** Voice ID (provider-specific or from voice enrollment) */
  voiceId?: string;
  /** Speed multiplier (0.5 = half speed, 2.0 = double) */
  speed?: number;
  /** Pitch adjustment in semitones (-10 to +10) */
  pitch?: number;
  /** Output audio format */
  outputFormat?: 'mp3' | 'wav' | 'ogg' | 'opus';
  /** Sample rate for output */
  sampleRateHz?: number;
  /** Whether to generate word-level timing for subtitle sync */
  enableWordTimestamps?: boolean;
}

export interface TTSWordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface TTSOutput {
  /** Complete audio data */
  audioBuffer: Buffer;
  /** Audio format */
  format: 'mp3' | 'wav' | 'ogg' | 'opus';
  /** Total audio duration in ms */
  durationMs: number;
  /** Sample rate of the output audio */
  sampleRateHz: number;
  /** Word-level timing for subtitle sync */
  wordTimings?: TTSWordTiming[];
  /** Provider-specific metadata */
  meta?: {
    model: string;
    voiceId: string;
    processingMs: number;
    characterCount: number;
  };
}

/**
 * Streaming TTS output — audio chunks delivered as they are generated.
 */
export interface TTSStreamHandle {
  /** Readable stream of raw audio chunks */
  audioStream: Readable;
  /** Audio format of the stream */
  format: 'mp3' | 'wav' | 'ogg' | 'opus';
  /** Sample rate */
  sampleRateHz: number;
  /** Called when synthesis is fully complete with final metadata */
  onComplete(
    cb: (result: {
      durationMs: number;
      wordTimings?: TTSWordTiming[];
      meta?: TTSOutput['meta'];
    }) => void,
  ): void;
  /** Called on error */
  onError(cb: (err: Error) => void): void;
  /** Abort synthesis */
  abort(): void;
}

/**
 * TTS provider interface.
 * Implement for Google TTS, ElevenLabs, Azure, AWS Polly, etc.
 */
export interface TTSProvider {
  readonly name: string;

  /** Synthesize complete audio buffer */
  synthesize(input: TTSInput): Promise<TTSOutput>;

  /** Streaming synthesis — returns audio chunks as they are generated */
  synthesizeStream?(input: TTSInput): Promise<TTSStreamHandle>;

  /** List available voices for a language */
  listVoices?(languageCode: string): Promise<VoiceInfo[]>;

  healthCheck(): Promise<boolean>;
}

// ─── Voice Info ─────────────────────────────────────────────

export interface VoiceInfo {
  voiceId: string;
  name: string;
  languageCodes: string[];
  gender?: 'male' | 'female' | 'neutral';
  /** Age range the voice represents */
  ageGroup?: 'child' | 'young_adult' | 'adult' | 'elder';
  /** Whether this is a user-enrolled custom voice */
  isCustom: boolean;
  /** Preview audio URL */
  previewUrl?: string;
}

// ─── Synthetic Output Labeling ──────────────────────────────

/**
 * Metadata that MUST accompany every synthesized audio response.
 * Required for regulatory compliance, platform transparency,
 * and to prevent misuse of AI-generated voice content.
 */
export interface SyntheticAudioLabel {
  /** Always true — marks content as AI-generated */
  isSynthetic: true;
  /** TTS provider that generated this audio */
  provider: string;
  /** Model used for synthesis */
  model?: string;
  /** Voice ID used */
  voiceId: string;
  /** Whether the voice is a user-enrolled custom voice */
  isCustomVoice: boolean;
  /** ISO 8601 timestamp of generation */
  generatedAt: string;
  /** Watermark ID for traceability (if provider supports audio watermarking) */
  watermarkId?: string;
}

// ─── Voice Enrollment (self-voice only) ─────────────────────

export type EnrollmentStatus =
  | 'pending_consent'
  | 'consent_granted'
  | 'samples_uploading'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'revoked';

export interface VoiceEnrollmentRequest {
  /** User ID of the person enrolling their OWN voice */
  userId: string;
  /** Display name for the voice */
  voiceName: string;
  /** Language the voice samples are in */
  languageCode: string;
}

export interface VoiceEnrollmentSample {
  /** Audio buffer of a single sample */
  audio: Buffer;
  format: 'wav' | 'mp3' | 'ogg';
  /** Duration of this sample in ms */
  durationMs: number;
  /** Transcript of what was spoken in the sample */
  transcript: string;
}

// ─── Abuse Reporting ────────────────────────────────────────

export type AbuseCategory =
  | 'impersonation'
  | 'harassment'
  | 'deepfake'
  | 'unauthorized_voice_use'
  | 'hate_speech'
  | 'other';

export interface AbuseReportInput {
  reporterUserId: string;
  /** The content being reported (voice output, enrollment, etc.) */
  targetType: 'voice_output' | 'voice_enrollment' | 'story_content';
  targetId: string;
  category: AbuseCategory;
  description: string;
}
