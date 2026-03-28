export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const STORY_MAX_PROMPT_LENGTH = 1000;
export const STORY_MAX_TITLE_LENGTH = 200;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export const AUTH_TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

export const OTP_DEFAULTS = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 5,
} as const;

export const CONSENT_TYPES = [
  'TERMS_OF_SERVICE',
  'PRIVACY_POLICY',
  'MARKETING_EMAIL',
  'DATA_PROCESSING',
  'ANALYTICS',
  'PUSH_NOTIFICATIONS',
] as const;

export const SENSITIVE_PREFERENCE_KEYS = [
  'payment_info',
  'phone_number',
  'address',
  'aadhaar_last4',
  'pan_number',
] as const;

export const MAX_DEVICE_SESSIONS = 5;

// ─── Story Engine ──────────────────────────────────────────

export const STORY_MODES = ['bedtime', 'warrior_success', 'mythology', 'motivation'] as const;
export const STORY_TONES = ['calm', 'funny', 'energetic'] as const;

export const STORY_ENGINE_DEFAULTS = {
  /** Maximum turns before the engine forces an ending */
  maxTurns: 20,
  /** Maximum choices per node */
  maxChoices: 3,
  /** Redis session TTL in seconds (2 hours) */
  sessionTtlSeconds: 7200,
  /** Maximum context window characters kept for the LLM */
  maxContextChars: 8000,
  /** Turn at which to hint the LLM towards wrapping up */
  windDownTurn: 15,
} as const;

export const MODERATION_BLOCKED_CATEGORIES = [
  'violence_graphic',
  'sexual',
  'hate_speech',
  'self_harm',
  'dangerous_content',
] as const;
