import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { STTService } from '../../src/modules/voice-pipeline/services/stt.service';

describe('STTService', () => {
  let service: STTService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        STTService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('mock') },
        },
      ],
    }).compile();

    service = module.get<STTService>(STTService);
  });

  describe('transcribe', () => {
    it('should return transcript with confidence', async () => {
      const audio = Buffer.from('fake-audio-data');
      const result = await service.transcribe(audio, 'hi-IN');

      expect(result.transcript).toBeDefined();
      expect(result.transcript.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.detectedLanguage).toBe('hi-IN');
    });

    it('should return word timings when requested', async () => {
      const audio = Buffer.from('fake-audio-data');
      const result = await service.transcribe(audio, 'en-IN', {
        enableWordTimestamps: true,
      });

      expect(result.wordTimings).toBeDefined();
      expect(result.wordTimings!.length).toBeGreaterThan(0);

      const first = result.wordTimings![0];
      expect(first.word).toBeDefined();
      expect(first.startMs).toBeDefined();
      expect(first.endMs).toBeGreaterThan(first.startMs);
      expect(first.confidence).toBeGreaterThan(0);
    });

    it('should include processing metadata', async () => {
      const audio = Buffer.from('test');
      const result = await service.transcribe(audio, 'en-IN');

      expect(result.meta).toBeDefined();
      expect(result.meta!.model).toBe('mock-stt-v1');
      expect(result.meta!.processingMs).toBeGreaterThanOrEqual(0);
      expect(result.meta!.audioDurationMs).toBeGreaterThan(0);
    });
  });

  describe('healthCheck', () => {
    it('should return true for mock provider', async () => {
      const result = await service.healthCheck();
      expect(result).toBe(true);
    });
  });
});
