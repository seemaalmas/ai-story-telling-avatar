import { StorySeedService } from '../../src/modules/story-engine/services/story-seed.service';
import { STORY_SEEDS } from '../../src/modules/story-engine/seeds';

describe('StorySeedService', () => {
  let service: StorySeedService;

  beforeEach(() => {
    service = new StorySeedService();
  });

  describe('getAllSeeds', () => {
    it('should return all seeds', () => {
      const seeds = service.getAllSeeds();
      expect(seeds.length).toBe(STORY_SEEDS.length);
      expect(seeds.length).toBeGreaterThanOrEqual(9);
    });

    it('should have seeds for every mode', () => {
      const seeds = service.getAllSeeds();
      const modes = new Set(seeds.map((s) => s.mode));
      expect(modes).toContain('bedtime');
      expect(modes).toContain('warrior_success');
      expect(modes).toContain('mythology');
      expect(modes).toContain('motivation');
    });
  });

  describe('getSeedsByMode', () => {
    it('should return only seeds for the given mode', () => {
      const seeds = service.getSeedsByMode('mythology');
      expect(seeds.length).toBeGreaterThanOrEqual(3);
      expect(seeds.every((s) => s.mode === 'mythology')).toBe(true);
    });

    it('should return empty array for unknown mode', () => {
      const seeds = service.getSeedsByMode('unknown' as never);
      expect(seeds).toEqual([]);
    });
  });

  describe('getSeedById', () => {
    it('should return a specific seed', () => {
      const seed = service.getSeedById('myth-hanuman-mountain');
      expect(seed).toBeDefined();
      expect(seed!.title).toContain('Hanuman');
    });

    it('should return undefined for unknown id', () => {
      const seed = service.getSeedById('nonexistent');
      expect(seed).toBeUndefined();
    });
  });

  describe('seed data quality', () => {
    it('every seed should have required fields', () => {
      const seeds = service.getAllSeeds();
      for (const seed of seeds) {
        expect(seed.id).toBeTruthy();
        expect(seed.mode).toBeTruthy();
        expect(seed.title).toBeTruthy();
        expect(seed.description).toBeTruthy();
        expect(seed.openingPrompt.length).toBeGreaterThan(50);
        expect(seed.suggestedTones.length).toBeGreaterThan(0);
        expect(seed.tags.length).toBeGreaterThan(0);
      }
    });

    it('every seed should have at least one localized title', () => {
      const seeds = service.getAllSeeds();
      for (const seed of seeds) {
        const localizedKeys = Object.keys(seed.titleLocalized);
        expect(localizedKeys.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('seed IDs should be unique', () => {
      const seeds = service.getAllSeeds();
      const ids = seeds.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
