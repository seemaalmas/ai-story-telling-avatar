import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StoryLLMService } from '../../src/modules/story-engine/services/story-llm.service';

describe('StoryLLMService', () => {
  let service: StoryLLMService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryLLMService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock'),
          },
        },
      ],
    }).compile();

    service = module.get<StoryLLMService>(StoryLLMService);
  });

  describe('generate (mock backend)', () => {
    it('should return valid JSON content', async () => {
      const result = await service.generate(
        'STORY MODE: BEDTIME\nTURN: 1',
        'Tell a bedtime story',
      );

      expect(result.content).toBeDefined();
      expect(result.model).toBe('mock-v1');
      expect(result.tokensUsed).toBeGreaterThan(0);

      // Should be parseable JSON
      const parsed = JSON.parse(result.content);
      expect(parsed.text).toBeDefined();
      expect(parsed.choices).toBeDefined();
      expect(parsed.animationCues).toBeDefined();
      expect(parsed.subtitles).toBeDefined();
      expect(typeof parsed.isEnding).toBe('boolean');
    });

    it('should generate non-ending response for early turns', async () => {
      const result = await service.generate(
        'STORY MODE: MYTHOLOGY\nTURN: 3',
        'Continue the story',
      );

      const parsed = JSON.parse(result.content);
      expect(parsed.isEnding).toBe(false);
      expect(parsed.choices.length).toBeGreaterThan(0);
    });

    it('should generate ending response for final turns', async () => {
      const result = await service.generate(
        'STORY MODE: BEDTIME\nTURN: 20\nfinal turn',
        'Continue the story',
      );

      const parsed = JSON.parse(result.content);
      expect(parsed.isEnding).toBe(true);
      expect(parsed.choices).toEqual([]);
    });

    it('should generate subtitles matching the text', async () => {
      const result = await service.generate(
        'STORY MODE: MOTIVATION\nTURN: 2',
        'Follow the dream',
      );

      const parsed = JSON.parse(result.content);
      expect(parsed.subtitles.length).toBeGreaterThan(0);
      expect(parsed.subtitles[0].startMs).toBe(0);
      expect(parsed.subtitles[0].endMs).toBeGreaterThan(0);
    });

    it('should generate different text for different modes', async () => {
      const bedtime = await service.generate('STORY MODE: BEDTIME\nTURN: 1', 'test');
      const warrior = await service.generate('STORY MODE: WARRIOR_SUCCESS\nTURN: 1', 'test');

      const bedtimeParsed = JSON.parse(bedtime.content);
      const warriorParsed = JSON.parse(warrior.content);

      // Mock generates mode-specific text
      expect(bedtimeParsed.text).not.toBe(warriorParsed.text);
    });
  });
});
