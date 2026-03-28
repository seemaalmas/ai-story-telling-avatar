// ─── Voice Pipeline Shared Types ────────────────────────────

export type VoiceEnrollmentStatus =
  | 'pending_consent'
  | 'consent_granted'
  | 'samples_uploading'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'revoked';

export type AbuseCategory =
  | 'impersonation'
  | 'harassment'
  | 'deepfake'
  | 'unauthorized_voice_use'
  | 'hate_speech'
  | 'other';

export type AbuseReportStatus =
  | 'open'
  | 'investigating'
  | 'resolved_action_taken'
  | 'resolved_no_action'
  | 'dismissed';

// ─── Synthetic Audio Label ──────────────────────────────────

export interface SyntheticAudioLabel {
  isSynthetic: true;
  provider: string;
  model?: string;
  voiceId: string;
  isCustomVoice: boolean;
  generatedAt: string;
  watermarkId?: string;
}

// ─── TTS Response (what the mobile client receives) ─────────

export interface TTSWordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface SubtitleTimingMeta {
  /** Word-level timings from TTS for precise subtitle sync */
  wordTimings: TTSWordTiming[];
  /** Audio duration in ms */
  audioDurationMs: number;
  /** Pre-computed subtitle segments aligned to word boundaries */
  segments: Array<{
    startMs: number;
    endMs: number;
    text: string;
  }>;
}

export interface VoiceSynthesisResponse {
  /** Base64-encoded audio data (for non-streaming responses) */
  audioBase64?: string;
  /** Audio format */
  format: 'mp3' | 'wav' | 'ogg' | 'opus';
  /** Duration in ms */
  durationMs: number;
  /** Sample rate */
  sampleRateHz: number;
  /** Synthetic output label — ALWAYS present */
  label: SyntheticAudioLabel;
  /** Subtitle timing metadata for client-side sync */
  subtitleTiming: SubtitleTimingMeta;
}

// ─── Voice Enrollment ───────────────────────────────────────

export interface VoiceEnrollment {
  id: string;
  userId: string;
  voiceName: string;
  languageCode: string;
  status: VoiceEnrollmentStatus;
  sampleCount: number;
  totalDurationMs: number;
  createdAt: string;
}

// ─── Abuse Report ───────────────────────────────────────────

export interface AbuseReport {
  id: string;
  reporterUserId: string;
  targetType: string;
  targetId: string;
  category: AbuseCategory;
  description: string;
  status: AbuseReportStatus;
  createdAt: string;
}
