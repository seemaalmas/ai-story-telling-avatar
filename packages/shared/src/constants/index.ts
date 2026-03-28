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

// ─── Subscription & Entitlements ───────────────────────────

export const PLAN_IDS = ['free', 'premium_monthly', 'premium_yearly', 'family'] as const;

export const FREE_PLAN_LIMITS = {
  storiesPerDay: 3,
  languageCount: 3,
  customVoice: false,
  familySharing: false,
  adsFree: false,
} as const;

export const PREMIUM_PLAN_LIMITS = {
  storiesPerDay: -1, // unlimited
  languageCount: 10,
  customVoice: true,
  familySharing: false,
  adsFree: true,
} as const;

export const FAMILY_PLAN_LIMITS = {
  ...PREMIUM_PLAN_LIMITS,
  familySharing: true,
  maxFamilyMembers: 5,
} as const;

export const PLAN_PRICES_INR = {
  free: 0,
  premium_monthly: 149,
  premium_yearly: 999,
  family: 249,
} as const;

export const STORE_PRODUCT_IDS = {
  premium_monthly: {
    appStore: 'com.katha.ai.premium.monthly',
    playStore: 'premium_monthly',
  },
  premium_yearly: {
    appStore: 'com.katha.ai.premium.yearly',
    playStore: 'premium_yearly',
  },
  family: {
    appStore: 'com.katha.ai.family.monthly',
    playStore: 'family_monthly',
  },
} as const;
