import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TTSService } from '../../src/modules/voice-pipeline/services/tts.service';

describe('TTSService', () => {
  let service: TTSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TTSService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock') },
        },
      ],
    }).compile();

    service = module.get<TTSService>(TTSService);
  });

  describe('synthesize', () => {
    it('should return audio with synthetic label', async () => {
      const result = await service.synthesize(
        'Hello world, this is a test.',
        'en',
        'mock-dadi',
      );

      expect(result.audioBase64).toBeDefined();
      expect(result.format).toBe('mp3');
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.sampleRateHz).toBe(24000);

      // Synthetic label must always be present
      expect(result.label.isSynthetic).toBe(true);
      expect(result.label.provider).toBe('mock-tts');
      expect(result.label.voiceId).toBe('mock-dadi');
      expect(result.label.isCustomVoice).toBe(false);
      expect(result.label.generatedAt).toBeDefined();
    });

    it('should return subtitle timing metadata', async () => {
      const result = await service.synthesize(
        'The brave princess walked through the enchanted forest seeking wisdom.',
        'en',
      );

      expect(result.subtitleTiming).toBeDefined();
      expect(result.subtitleTiming.audioDurationMs).toBeGreaterThan(0);
      expect(result.subtitleTiming.wordTimings.length).toBeGreaterThan(0);
      expect(result.subtitleTiming.segments.length).toBeGreaterThan(0);

      // Verify word timing structure
      const firstWord = result.subtitleTiming.wordTimings[0];
      expect(firstWord.word).toBeDefined();
      expect(firstWord.startMs).toBe(0);
      expect(firstWord.endMs).toBeGreaterThan(0);

      // Verify segments are chronologically ordered
      for (let i = 1; i < result.subtitleTiming.segments.length; i++) {
        expect(result.subtitleTiming.segments[i].startMs).toBeGreaterThanOrEqual(
          result.subtitleTiming.segments[i - 1].startMs,
        );
      }
    });

    it('should mark custom voice in label', async () => {
      const result = await service.synthesize('test', 'en', 'custom-voice', {
        isCustomVoice: true,
      });

      expect(result.label.isCustomVoice).toBe(true);
    });

    it('should handle speed adjustment', async () => {
      const normalResult = await service.synthesize('test text', 'en');
      const fastResult = await service.synthesize('test text', 'en', undefined, {
        speed: 2.0,
      });

      // Faster speed should produce shorter audio
      expect(fastResult.durationMs).toBeLessThan(normalResult.durationMs);
    });
  });

  describe('synthesizeStream', () => {
    it('should return a readable stream', async () => {
      const handle = await service.synthesizeStream('Hello world', 'en');

      expect(handle.audioStream).toBeDefined();
      expect(handle.format).toBe('mp3');
      expect(handle.sampleRateHz).toBe(24000);

      // Collect stream data
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        handle.audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        handle.audioStream.on('end', resolve);
        handle.audioStream.on('error', reject);
      });

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should call onComplete with timing data', async () => {
      const handle = await service.synthesizeStream('A short test', 'en');

      const completionPromise = new Promise<{ durationMs: number }>((resolve) => {
        handle.onComplete(resolve);
      });

      // Drain stream
      handle.audioStream.on('data', () => {});
      await new Promise<void>((resolve) => handle.audioStream.on('end', resolve));

      const result = await completionPromise;
      expect(result.durationMs).toBeGreaterThan(0);
    });
  });

  describe('listVoices', () => {
    it('should return voices for Hindi', async () => {
      const voices = await service.listVoices('hi');
      expect(voices.length).toBeGreaterThan(0);
      expect(voices.every((v) => !v.isCustom)).toBe(true);
    });

    it('should include voice metadata', async () => {
      const voices = await service.listVoices('en');
      const voice = voices[0];
      expect(voice.voiceId).toBeDefined();
      expect(voice.name).toBeDefined();
      expect(voice.languageCodes.length).toBeGreaterThan(0);
    });
  });

  describe('buildSubtitleTiming', () => {
    it('should group words into ~6-word segments', () => {
      const mockResult = {
        audioBuffer: Buffer.alloc(0),
        format: 'mp3' as const,
        durationMs: 5000,
        sampleRateHz: 24000,
        wordTimings: Array.from({ length: 18 }, (_, i) => ({
          word: `word${i}`,
          startMs: i * 250,
          endMs: i * 250 + 200,
        })),
      };

      const timing = service.buildSubtitleTiming(mockResult);

      // 18 words / 6 per segment = 3 segments
      expect(timing.segments.length).toBe(3);
      expect(timing.segments[0].text.split(' ').length).toBe(6);
    });
  });
});
