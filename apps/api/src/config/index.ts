import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'katha-ai',
  port: parseInt(process.env.APP_PORT ?? '7000', 10),
  env: process.env.NODE_ENV ?? 'development',
  encryptionSecret: process.env.ENCRYPTION_SECRET ?? 'change-me-32-char-secret-key!!!',
  aiProvider: process.env.AI_PROVIDER ?? 'mock',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  otp: {
    length: parseInt(process.env.OTP_LENGTH ?? '6', 10),
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES ?? '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
    rateLimitTtl: parseInt(process.env.OTP_RATE_LIMIT_TTL ?? '60000', 10),
    rateLimitMax: parseInt(process.env.OTP_RATE_LIMIT_MAX ?? '3', 10),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID,
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY,
  },
  maxDeviceSessions: parseInt(process.env.MAX_DEVICE_SESSIONS ?? '5', 10),
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? undefined,
}));

export const storyEngineConfig = registerAs('storyEngine', () => ({
  maxTurns: parseInt(process.env.STORY_MAX_TURNS ?? '20', 10),
  maxChoices: parseInt(process.env.STORY_MAX_CHOICES ?? '3', 10),
  sessionTtlSeconds: parseInt(process.env.STORY_SESSION_TTL ?? '7200', 10),
  maxContextChars: parseInt(process.env.STORY_MAX_CONTEXT_CHARS ?? '8000', 10),
  windDownTurn: parseInt(process.env.STORY_WIND_DOWN_TURN ?? '15', 10),
}));

export const voiceConfig = registerAs('voice', () => ({
  ttsProvider: process.env.TTS_PROVIDER ?? 'mock',
  sttProvider: process.env.STT_PROVIDER ?? 'mock',
  defaultVoiceId: process.env.DEFAULT_VOICE_ID ?? 'mock-dadi',
  maxSynthesisChars: parseInt(process.env.MAX_SYNTHESIS_CHARS ?? '5000', 10),
  enableSelfVoiceEnrollment: process.env.ENABLE_SELF_VOICE_ENROLLMENT === 'true',
  abuseAutoSuspendThreshold: parseInt(process.env.ABUSE_AUTO_SUSPEND_THRESHOLD ?? '3', 10),
}));

export const subscriptionConfig = registerAs('subscription', () => ({
  appleSharedSecret: process.env.APPLE_SHARED_SECRET,
  googleServiceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  webhookSecret: process.env.SUBSCRIPTION_WEBHOOK_SECRET,
  trialDays: parseInt(process.env.TRIAL_DAYS ?? '0', 10),
}));
