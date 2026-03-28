import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

import type {
  TTSProvider,
  TTSInput,
  TTSOutput,
  TTSStreamHandle,
  TTSWordTiming,
  VoiceInfo,
  SyntheticAudioLabel,
} from '@katha/ai-providers';
import { MockTTSProvider } from '@katha/ai-providers';

import type { SubtitleTimingMeta, VoiceSynthesisResponse } from '@katha/shared';

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);
  private provider: TTSProvider;

  constructor(private readonly config: ConfigService) {
    const providerName = this.config.get<string>('voice.ttsProvider') ?? 'mock';
    this.provider = this.createProvider(providerName);
    this.logger.log(`TTS provider: ${this.provider.name}`);
  }

  /**
   * Synthesize text and return a complete response with
   * synthetic labeling and subtitle timing metadata.
   */
  async synthesize(
    text: string,
    languageCode: string,
    voiceId?: string,
    options?: { speed?: number; isCustomVoice?: boolean },
  ): Promise<VoiceSynthesisResponse> {
    const input: TTSInput = {
      text,
      languageCode,
      voiceId,
      speed: options?.speed,
      outputFormat: 'mp3',
      sampleRateHz: 24000,
      enableWordTimestamps: true,
    };

    const result = await this.provider.synthesize(input);

    const label = this.buildLabel(result, voiceId, options?.isCustomVoice);
    const subtitleTiming = this.buildSubtitleTiming(result);

    return {
      audioBase64: result.audioBuffer.toString('base64'),
      format: result.format,
      durationMs: result.durationMs,
      sampleRateHz: result.sampleRateHz,
      label,
      subtitleTiming,
    };
  }

  /**
   * Stream synthesis — returns a readable audio stream plus a promise
   * that resolves with metadata when synthesis completes.
   */
  async synthesizeStream(
    text: string,
    languageCode: string,
    voiceId?: string,
    options?: { speed?: number },
  ): Promise<{
    audioStream: Readable;
    format: string;
    sampleRateHz: number;
    onComplete: TTSStreamHandle['onComplete'];
    onError: TTSStreamHandle['onError'];
    abort: TTSStreamHandle['abort'];
  }> {
    if (!this.provider.synthesizeStream) {
      // Fallback: synthesize fully, then wrap in a readable
      const result = await this.provider.synthesize({
        text,
        languageCode,
        voiceId,
        speed: options?.speed,
        outputFormat: 'mp3',
        sampleRateHz: 24000,
        enableWordTimestamps: true,
      });

      const stream = new Readable({ read() {} });
      stream.push(result.audioBuffer);
      stream.push(null);

      return {
        audioStream: stream,
        format: result.format,
        sampleRateHz: result.sampleRateHz,
        onComplete: (cb) =>
          cb({
            durationMs: result.durationMs,
            wordTimings: result.wordTimings,
            meta: result.meta,
          }),
        onError: () => {},
        abort: () => stream.destroy(),
      };
    }

    const handle = await this.provider.synthesizeStream({
      text,
      languageCode,
      voiceId,
      speed: options?.speed,
      outputFormat: 'mp3',
      sampleRateHz: 24000,
      enableWordTimestamps: true,
    });

    return {
      audioStream: handle.audioStream,
      format: handle.format,
      sampleRateHz: handle.sampleRateHz,
      onComplete: handle.onComplete.bind(handle),
      onError: handle.onError.bind(handle),
      abort: handle.abort.bind(handle),
    };
  }

  async listVoices(languageCode: string): Promise<VoiceInfo[]> {
    if (!this.provider.listVoices) return [];
    return this.provider.listVoices(languageCode);
  }

  async healthCheck(): Promise<boolean> {
    return this.provider.healthCheck();
  }

  // ─── Synthetic Label Builder ────────────────────────────

  buildLabel(
    result: TTSOutput,
    voiceId?: string,
    isCustomVoice?: boolean,
  ): SyntheticAudioLabel {
    return {
      isSynthetic: true,
      provider: this.provider.name,
      model: result.meta?.model,
      voiceId: voiceId ?? result.meta?.voiceId ?? 'default',
      isCustomVoice: isCustomVoice ?? false,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Subtitle Timing Builder ────────────────────────────

  buildSubtitleTiming(result: TTSOutput): SubtitleTimingMeta {
    const wordTimings = result.wordTimings ?? [];

    // Build subtitle segments: group words into ~6-word chunks
    const segments: SubtitleTimingMeta['segments'] = [];
    const WORDS_PER_SEGMENT = 6;

    for (let i = 0; i < wordTimings.length; i += WORDS_PER_SEGMENT) {
      const chunk = wordTimings.slice(i, i + WORDS_PER_SEGMENT);
      if (chunk.length === 0) continue;

      segments.push({
        startMs: chunk[0].startMs,
        endMs: chunk[chunk.length - 1].endMs,
        text: chunk.map((w) => w.word).join(' '),
      });
    }

    return {
      wordTimings,
      audioDurationMs: result.durationMs,
      segments,
    };
  }

  // ─── Provider Factory ───────────────────────────────────

  private createProvider(name: string): TTSProvider {
    switch (name) {
      case 'mock':
        return new MockTTSProvider();
      case 'elevenlabs':
        // TODO: return new ElevenLabsTTSProvider(this.config);
        throw new Error('ElevenLabs TTS not yet implemented');
      case 'google':
        // TODO: return new GoogleTTSProvider(this.config);
        throw new Error('Google TTS not yet implemented');
      case 'azure':
        // TODO: return new AzureTTSProvider(this.config);
        throw new Error('Azure TTS not yet implemented');
      default:
        this.logger.warn(`Unknown TTS provider "${name}", falling back to mock`);
        return new MockTTSProvider();
    }
  }
}
