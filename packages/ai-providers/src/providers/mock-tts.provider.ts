import { Readable } from 'stream';
import type {
  TTSProvider,
  TTSInput,
  TTSOutput,
  TTSStreamHandle,
  TTSWordTiming,
  VoiceInfo,
} from '../interfaces/voice';

/** Average speaking rate: ~150 words per minute = ~400ms per word */
const MS_PER_WORD = 400;

/**
 * Mock TTS provider for development and testing.
 * Generates silent audio buffers with realistic word-level timing metadata.
 */
export class MockTTSProvider implements TTSProvider {
  readonly name = 'mock-tts';

  async synthesize(input: TTSInput): Promise<TTSOutput> {
    const startTime = Date.now();
    const words = input.text.split(/\s+/).filter(Boolean);
    const speed = input.speed ?? 1.0;
    const msPerWord = MS_PER_WORD / speed;

    const wordTimings: TTSWordTiming[] = [];
    let offsetMs = 0;
    for (const word of words) {
      const duration = Math.round(msPerWord * (0.8 + Math.random() * 0.4));
      wordTimings.push({ word, startMs: offsetMs, endMs: offsetMs + duration });
      offsetMs += duration;
    }

    const durationMs = offsetMs;

    // Generate a silent audio buffer sized proportionally
    // (real providers would return actual audio bytes)
    const bytesPerMs = 16; // ~128kbps mp3 approximation
    const bufferSize = Math.max(64, Math.round(durationMs * bytesPerMs));
    const audioBuffer = Buffer.alloc(bufferSize);

    // Write a minimal valid header marker so consumers know it's mock
    audioBuffer.write('MOCK-AUDIO', 0, 'utf8');

    return {
      audioBuffer,
      format: input.outputFormat ?? 'mp3',
      durationMs,
      sampleRateHz: input.sampleRateHz ?? 24000,
      wordTimings: input.enableWordTimestamps !== false ? wordTimings : undefined,
      meta: {
        model: 'mock-tts-v1',
        voiceId: input.voiceId ?? 'mock-default-voice',
        processingMs: Date.now() - startTime,
        characterCount: input.text.length,
      },
    };
  }

  async synthesizeStream(input: TTSInput): Promise<TTSStreamHandle> {
    const words = input.text.split(/\s+/).filter(Boolean);
    const speed = input.speed ?? 1.0;
    const msPerWord = MS_PER_WORD / speed;

    const audioStream = new Readable({ read() {} });
    let completeCb: ((result: {
      durationMs: number;
      wordTimings?: TTSWordTiming[];
      meta?: TTSOutput['meta'];
    }) => void) | null = null;
    let errorCb: ((err: Error) => void) | null = null;
    let aborted = false;

    // Simulate streaming: push chunks with small delays
    const streamLoop = async () => {
      const wordTimings: TTSWordTiming[] = [];
      let offsetMs = 0;

      for (let i = 0; i < words.length; i++) {
        if (aborted) return;

        const duration = Math.round(msPerWord * (0.8 + Math.random() * 0.4));
        wordTimings.push({
          word: words[i],
          startMs: offsetMs,
          endMs: offsetMs + duration,
        });
        offsetMs += duration;

        // Push a chunk of "audio" bytes
        const chunk = Buffer.alloc(Math.round(duration * 16));
        audioStream.push(chunk);

        // Simulate real-time-ish streaming
        await new Promise((r) => setTimeout(r, 10));
      }

      audioStream.push(null); // end stream

      if (completeCb) {
        completeCb({
          durationMs: offsetMs,
          wordTimings,
          meta: {
            model: 'mock-tts-v1',
            voiceId: input.voiceId ?? 'mock-default-voice',
            processingMs: Math.round(words.length * 10),
            characterCount: input.text.length,
          },
        });
      }
    };

    // Start streaming asynchronously
    streamLoop().catch((err) => {
      if (errorCb) errorCb(err);
    });

    return {
      audioStream,
      format: input.outputFormat ?? 'mp3',
      sampleRateHz: input.sampleRateHz ?? 24000,
      onComplete(cb) {
        completeCb = cb;
      },
      onError(cb) {
        errorCb = cb;
      },
      abort() {
        aborted = true;
        audioStream.push(null);
      },
    };
  }

  async listVoices(languageCode: string): Promise<VoiceInfo[]> {
    const voices: VoiceInfo[] = [
      {
        voiceId: 'mock-dadi',
        name: 'Dadi (Grandmother)',
        languageCodes: ['hi-IN', 'en-IN'],
        gender: 'female',
        ageGroup: 'elder',
        isCustom: false,
      },
      {
        voiceId: 'mock-guru',
        name: 'Guru Ji',
        languageCodes: ['hi-IN', 'en-IN', 'sa-IN'],
        gender: 'male',
        ageGroup: 'adult',
        isCustom: false,
      },
      {
        voiceId: 'mock-rani',
        name: 'Rani',
        languageCodes: ['hi-IN', 'en-IN', 'ta-IN'],
        gender: 'female',
        ageGroup: 'young_adult',
        isCustom: false,
      },
      {
        voiceId: 'mock-kavi',
        name: 'Kavi',
        languageCodes: ['hi-IN', 'en-IN', 'bn-IN'],
        gender: 'male',
        ageGroup: 'young_adult',
        isCustom: false,
      },
    ];

    const lang = languageCode.split('-')[0];
    return voices.filter((v) =>
      v.languageCodes.some((lc) => lc.startsWith(lang)),
    );
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
