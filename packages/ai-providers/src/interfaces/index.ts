export interface StoryGenerationInput {
  prompt: string;
  language: string;
  avatarPersonality?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StoryGenerationOutput {
  content: string;
  title?: string;
  metadata?: {
    tokensUsed: number;
    model: string;
    generationTimeMs: number;
  };
}

export interface TextToSpeechInput {
  text: string;
  language: string;
  voiceId?: string;
  speed?: number;
}

export interface TextToSpeechOutput {
  audioBuffer: Buffer;
  format: 'mp3' | 'wav' | 'ogg';
  durationMs: number;
}

export interface AvatarImageInput {
  description: string;
  style?: 'cartoon' | 'realistic' | 'anime' | 'folk-art';
  size?: { width: number; height: number };
}

export interface AvatarImageOutput {
  imageUrl: string;
  imageBuffer?: Buffer;
}

export interface TranslationInput {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationOutput {
  translatedText: string;
  confidence: number;
}

/**
 * Core AI provider interface.
 * Implement this for each AI service (OpenAI, Anthropic, Google AI, etc.)
 */
export interface AIProvider {
  readonly name: string;

  generateStory(input: StoryGenerationInput): Promise<StoryGenerationOutput>;

  generateSpeech?(input: TextToSpeechInput): Promise<TextToSpeechOutput>;

  generateAvatarImage?(input: AvatarImageInput): Promise<AvatarImageOutput>;

  translate?(input: TranslationInput): Promise<TranslationOutput>;

  healthCheck(): Promise<boolean>;
}

/**
 * Provider configuration interface.
 * Each provider implementation should define its own config.
 */
export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
}
