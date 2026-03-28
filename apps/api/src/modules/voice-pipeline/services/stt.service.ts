import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { STTProvider, STTInput, STTOutput } from '@katha/ai-providers';
import { MockSTTProvider } from '@katha/ai-providers';

@Injectable()
export class STTService {
  private readonly logger = new Logger(STTService.name);
  private provider: STTProvider;

  constructor(private readonly config: ConfigService) {
    const providerName = this.config.get<string>('voice.sttProvider') ?? 'mock';
    this.provider = this.createProvider(providerName);
    this.logger.log(`STT provider: ${this.provider.name}`);
  }

  /**
   * Transcribe a complete audio buffer.
   */
  async transcribe(
    audio: Buffer,
    languageCode: string,
    options?: {
      format?: STTInput['format'];
      enableWordTimestamps?: boolean;
    },
  ): Promise<STTOutput> {
    return this.provider.transcribe({
      audio,
      format: options?.format ?? 'wav',
      languageCode,
      enableWordTimestamps: options?.enableWordTimestamps ?? true,
      enablePunctuation: true,
    });
  }

  /**
   * Start a streaming transcription session.
   * Returns null if the provider doesn't support streaming.
   */
  startStreamingTranscription(languageCode: string) {
    if (!this.provider.transcribeStream) {
      this.logger.warn('STT provider does not support streaming');
      return null;
    }

    return this.provider.transcribeStream({
      format: 'webm',
      languageCode,
      enableWordTimestamps: true,
      enablePunctuation: true,
    });
  }

  async healthCheck(): Promise<boolean> {
    return this.provider.healthCheck();
  }

  private createProvider(name: string): STTProvider {
    switch (name) {
      case 'mock':
        return new MockSTTProvider();
      case 'google':
        // TODO: return new GoogleSTTProvider(this.config);
        throw new Error('Google STT not yet implemented');
      case 'deepgram':
        // TODO: return new DeepgramSTTProvider(this.config);
        throw new Error('Deepgram STT not yet implemented');
      case 'whisper':
        // TODO: return new WhisperSTTProvider(this.config);
        throw new Error('Whisper STT not yet implemented');
      default:
        this.logger.warn(`Unknown STT provider "${name}", falling back to mock`);
        return new MockSTTProvider();
    }
  }
}
