import { MockTTSProvider } from '../../../../packages/ai-providers/src/providers/mock-tts.provider';

describe('MockTTSProvider', () => {
  let provider: MockTTSProvider;

  beforeEach(() => {
    provider = new MockTTSProvider();
  });

  describe('synthesize', () => {
    it('should return audio buffer with correct format', async () => {
      const result = await provider.synthesize({
        text: 'Hello world',
        languageCode: 'en-IN',
      });

      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.audioBuffer.length).toBeGreaterThan(0);
      expect(result.format).toBe('mp3');
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.sampleRateHz).toBe(24000);
    });

    it('should generate word timings by default', async () => {
      const result = await provider.synthesize({
        text: 'Once upon a time in India',
        languageCode: 'en-IN',
      });

      expect(result.wordTimings).toBeDefined();
      expect(result.wordTimings!.length).toBe(6); // 6 words
      expect(result.wordTimings![0].word).toBe('Once');
      expect(result.wordTimings![0].startMs).toBe(0);
    });

    it('should adjust duration based on speed', async () => {
      const normal = await provider.synthesize({
        text: 'test text here',
        languageCode: 'en',
        speed: 1.0,
      });
      const fast = await provider.synthesize({
        text: 'test text here',
        languageCode: 'en',
        speed: 2.0,
      });

      expect(fast.durationMs).toBeLessThan(normal.durationMs);
    });

    it('should include metadata', async () => {
      const result = await provider.synthesize({
        text: 'test',
        languageCode: 'hi-IN',
        voiceId: 'mock-dadi',
      });

      expect(result.meta).toBeDefined();
      expect(result.meta!.model).toBe('mock-tts-v1');
      expect(result.meta!.voiceId).toBe('mock-dadi');
      expect(result.meta!.characterCount).toBe(4);
    });
  });

  describe('synthesizeStream', () => {
    it('should stream audio chunks and call onComplete', async () => {
      const handle = await provider.synthesizeStream({
        text: 'A short story',
        languageCode: 'en-IN',
      });

      expect(handle.audioStream).toBeDefined();
      expect(handle.format).toBe('mp3');

      const chunks: Buffer[] = [];
      const completePromise = new Promise<{ durationMs: number }>((resolve) => {
        handle.onComplete(resolve);
      });

      handle.audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      await new Promise<void>((r) => handle.audioStream.on('end', r));

      const result = await completePromise;
      expect(chunks.length).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.wordTimings).toBeDefined();
    });

    it('should support abort', async () => {
      const handle = await provider.synthesizeStream({
        text: 'A very long text that should be aborted mid-stream for testing purposes',
        languageCode: 'en-IN',
      });

      // Immediately abort
      handle.abort();

      const chunks: Buffer[] = [];
      handle.audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      await new Promise<void>((r) => handle.audioStream.on('end', r));

      // Stream should end quickly (may have 0 or very few chunks)
      expect(chunks.length).toBeLessThan(10);
    });
  });

  describe('listVoices', () => {
    it('should return voices for Hindi', async () => {
      const voices = await provider.listVoices('hi-IN');
      expect(voices.length).toBeGreaterThan(0);
      expect(voices.every((v) => v.languageCodes.some((lc) => lc.startsWith('hi')))).toBe(true);
    });

    it('should return empty for unsupported language', async () => {
      const voices = await provider.listVoices('xx-XX');
      expect(voices).toEqual([]);
    });

    it('should mark all voices as non-custom', async () => {
      const voices = await provider.listVoices('en');
      expect(voices.every((v) => !v.isCustom)).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return true', async () => {
      expect(await provider.healthCheck()).toBe(true);
    });
  });
});
