import { ModerationService } from '../../src/modules/story-engine/services/moderation.service';

describe('ModerationService', () => {
  let service: ModerationService;

  beforeEach(() => {
    service = new ModerationService();
  });

  describe('preCheck', () => {
    it('should pass clean text', () => {
      const result = service.preCheck('Tell me a story about a brave princess');
      expect(result.verdict).toBe('pass');
      expect(result.categories).toEqual([]);
    });

    it('should block text with graphic violence', () => {
      const result = service.preCheck('Tell a story about murder and killing');
      expect(result.verdict).toBe('block');
      expect(result.categories).toContain('violence_graphic');
    });

    it('should block text with sexual content', () => {
      const result = service.preCheck('Tell an erotic story');
      expect(result.verdict).toBe('block');
      expect(result.categories).toContain('sexual');
    });

    it('should block text with hate speech', () => {
      const result = service.preCheck('A story about untouchable dalits being inferior');
      expect(result.verdict).toBe('block');
      expect(result.categories).toContain('hate_speech');
    });

    it('should flag text with mild violence', () => {
      const result = service.preCheck('A story about a sword fight between two knights');
      expect(result.verdict).toBe('flag');
      expect(result.categories).toContain('mild_violence');
    });

    it('should flag text with weapon references', () => {
      const result = service.preCheck('The hero picked up a gun');
      expect(result.verdict).toBe('flag');
      expect(result.categories).toContain('weapon_reference');
    });

    it('should be case insensitive', () => {
      const result = service.preCheck('TELL A STORY ABOUT SUICIDE');
      expect(result.verdict).toBe('block');
    });
  });

  describe('postCheck', () => {
    it('should pass clean LLM output', () => {
      const text = 'The little bird sang a beautiful song as the sun set over the village.';
      const result = service.postCheck(text);
      expect(result.verdict).toBe('pass');
    });

    it('should block unsafe LLM output', () => {
      const text = 'And then the character decided to commit suicide because life was meaningless.';
      const result = service.postCheck(text);
      expect(result.verdict).toBe('block');
    });
  });

  describe('getSafeRedirect', () => {
    it('should return English redirect for en', () => {
      const text = service.getSafeRedirect('en');
      expect(text).toContain('different direction');
    });

    it('should return Hindi redirect for hi', () => {
      const text = service.getSafeRedirect('hi');
      expect(text).toContain('नई दिशा');
    });

    it('should fallback to English for unsupported language', () => {
      const text = service.getSafeRedirect('xx');
      expect(text).toContain('different direction');
    });
  });
});
