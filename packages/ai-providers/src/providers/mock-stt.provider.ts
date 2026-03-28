import type { STTProvider, STTInput, STTOutput } from '../interfaces/voice';

/**
 * Mock STT provider for development and testing.
 * Returns a deterministic transcript without calling any external API.
 */
export class MockSTTProvider implements STTProvider {
  readonly name = 'mock-stt';

  async transcribe(input: STTInput): Promise<STTOutput> {
    const startTime = Date.now();

    // Simulate processing delay proportional to "audio length"
    const audioLength =
      input.audio instanceof Buffer ? input.audio.length : 1024;
    await new Promise((r) => setTimeout(r, Math.min(audioLength / 10, 500)));

    const transcript = `[Mock transcript in ${input.languageCode}] This is a simulated transcription of the provided audio.`;

    const words = transcript.split(/\s+/);
    const wordTimings = input.enableWordTimestamps
      ? words.map((word, i) => ({
          word,
          startMs: i * 300,
          endMs: i * 300 + 250,
          confidence: 0.92 + Math.random() * 0.08,
        }))
      : undefined;

    return {
      transcript,
      confidence: 0.95,
      detectedLanguage: input.languageCode,
      wordTimings,
      meta: {
        model: 'mock-stt-v1',
        processingMs: Date.now() - startTime,
        audioDurationMs: audioLength * 8,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
