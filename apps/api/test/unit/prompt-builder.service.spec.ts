import { PromptBuilderService } from '../../src/modules/story-engine/services/prompt-builder.service';

describe('PromptBuilderService', () => {
  let service: PromptBuilderService;

  beforeEach(() => {
    service = new PromptBuilderService();
  });

  describe('buildPrompt', () => {
    it('should include mode directive in system prompt', () => {
      const { system } = service.buildPrompt({
        mode: 'mythology',
        tone: 'calm',
        language: 'en',
        context: '',
        userInput: 'A tale of Ganesha',
        turnNumber: 1,
        shouldEnd: false,
      });

      expect(system).toContain('STORY MODE: MYTHOLOGY');
      expect(system).toContain('Indian mythology');
      expect(system).toContain('Ramayana');
    });

    it('should include tone modifier', () => {
      const { system } = service.buildPrompt({
        mode: 'bedtime',
        tone: 'funny',
        language: 'en',
        context: '',
        userInput: 'test',
        turnNumber: 1,
        shouldEnd: false,
      });

      expect(system).toContain('TONE: FUNNY');
      expect(system).toContain('humour');
    });

    it('should include safety rules', () => {
      const { system } = service.buildPrompt({
        mode: 'warrior_success',
        tone: 'energetic',
        language: 'hi',
        context: '',
        userInput: 'test',
        turnNumber: 1,
        shouldEnd: false,
      });

      expect(system).toContain('SAFETY RULES');
      expect(system).toContain('appropriate for all ages');
      expect(system).toContain('No sexual content');
    });

    it('should include language instruction', () => {
      const { system } = service.buildPrompt({
        mode: 'bedtime',
        tone: 'calm',
        language: 'ta',
        context: '',
        userInput: 'test',
        turnNumber: 1,
        shouldEnd: false,
      });

      expect(system).toContain('LANGUAGE: Respond entirely in "ta"');
      expect(system).toContain('native script');
    });

    it('should include ending instruction on final turn', () => {
      const { system } = service.buildPrompt({
        mode: 'bedtime',
        tone: 'calm',
        language: 'en',
        context: '',
        userInput: 'test',
        turnNumber: 20,
        shouldEnd: true,
      });

      expect(system).toContain('final turn');
      expect(system).toContain('satisfying conclusion');
      expect(system).toContain('isEnding to true');
    });

    it('should include wind-down hint at turn 15+', () => {
      const { system } = service.buildPrompt({
        mode: 'motivation',
        tone: 'energetic',
        language: 'en',
        context: '',
        userInput: 'test',
        turnNumber: 16,
        shouldEnd: false,
      });

      expect(system).toContain('winding down');
    });

    it('should include JSON output format', () => {
      const { system } = service.buildPrompt({
        mode: 'bedtime',
        tone: 'calm',
        language: 'en',
        context: '',
        userInput: 'test',
        turnNumber: 1,
        shouldEnd: false,
      });

      expect(system).toContain('"text"');
      expect(system).toContain('"choices"');
      expect(system).toContain('"animationCues"');
      expect(system).toContain('"subtitles"');
      expect(system).toContain('"isEnding"');
    });

    it('should build correct user prompt for turn 1', () => {
      const { user } = service.buildPrompt({
        mode: 'bedtime',
        tone: 'calm',
        language: 'en',
        context: '',
        userInput: 'A story about a magic river',
        turnNumber: 1,
        shouldEnd: false,
      });

      expect(user).toContain('Begin a new story');
      expect(user).toContain('A story about a magic river');
    });

    it('should build correct user prompt for subsequent turns', () => {
      const { user } = service.buildPrompt({
        mode: 'bedtime',
        tone: 'calm',
        language: 'en',
        context: 'Previous story text here',
        userInput: 'Follow the path',
        turnNumber: 3,
        shouldEnd: false,
      });

      expect(user).toContain('Story so far:');
      expect(user).toContain('Previous story text here');
      expect(user).toContain('The listener chose: "Follow the path"');
    });

    it('should include avatar personality when provided', () => {
      const { system } = service.buildPrompt({
        mode: 'mythology',
        tone: 'calm',
        language: 'en',
        avatarPersonality: 'A wise grandmother who speaks with warmth',
        context: '',
        userInput: 'test',
        turnNumber: 1,
        shouldEnd: false,
      });

      expect(system).toContain('NARRATOR PERSONALITY');
      expect(system).toContain('wise grandmother');
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON response', () => {
      const raw = JSON.stringify({
        text: 'The story begins...',
        choices: [{ choiceId: 'c1', label: 'Go left' }],
        animationCues: [{ timestampMs: 0, durationMs: 1000, type: 'expression', value: 'smile' }],
        subtitles: [{ startMs: 0, endMs: 2000, text: 'The story begins...' }],
        isEnding: false,
      });

      const parsed = service.parseResponse(raw);

      expect(parsed.text).toBe('The story begins...');
      expect(parsed.choices).toHaveLength(1);
      expect(parsed.animationCues).toHaveLength(1);
      expect(parsed.isEnding).toBe(false);
    });

    it('should strip markdown code fences', () => {
      const raw = '```json\n{"text":"Hello","choices":[],"animationCues":[],"subtitles":[],"isEnding":true}\n```';
      const parsed = service.parseResponse(raw);

      expect(parsed.text).toBe('Hello');
      expect(parsed.isEnding).toBe(true);
    });

    it('should default missing arrays', () => {
      const raw = JSON.stringify({ text: 'Hello' });
      const parsed = service.parseResponse(raw);

      expect(parsed.choices).toEqual([]);
      expect(parsed.animationCues).toEqual([]);
      expect(parsed.subtitles).toEqual([]);
      expect(parsed.isEnding).toBe(false);
    });

    it('should throw on missing text', () => {
      const raw = JSON.stringify({ choices: [] });
      expect(() => service.parseResponse(raw)).toThrow('missing "text"');
    });

    it('should throw on invalid JSON', () => {
      expect(() => service.parseResponse('not json at all')).toThrow();
    });
  });
});
