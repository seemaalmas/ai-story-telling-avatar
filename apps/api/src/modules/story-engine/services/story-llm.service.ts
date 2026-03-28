import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Provider-agnostic LLM interface for the story engine.
 *
 * This service abstracts the actual LLM call so the story engine
 * doesn't care whether the backend is OpenAI, Anthropic, Google, or a mock.
 * Swap the implementation by changing the AI_PROVIDER env var.
 */

export interface LLMGenerateResult {
  content: string;
  model: string;
  tokensUsed: number;
}

/**
 * Contract that any LLM backend must implement.
 */
export interface LLMBackend {
  generate(systemPrompt: string, userPrompt: string): Promise<LLMGenerateResult>;
}

/**
 * Mock LLM backend for development and testing.
 * Returns realistic-looking structured JSON without calling any external API.
 */
class MockLLMBackend implements LLMBackend {
  async generate(systemPrompt: string, userPrompt: string): Promise<LLMGenerateResult> {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 200));

    const isFinalTurn = systemPrompt.includes('final turn');
    const turnMatch = systemPrompt.match(/TURN:\s*(\d+)/);
    const turn = turnMatch ? parseInt(turnMatch[1], 10) : 1;

    const modeMatch = systemPrompt.match(/STORY MODE:\s*(\w+)/);
    const mode = modeMatch ? modeMatch[1].toLowerCase() : 'bedtime';

    const text = this.generateMockText(mode, turn, userPrompt);
    const isEnding = isFinalTurn || turn > 18;

    const response = {
      text,
      choices: isEnding
        ? []
        : [
            { choiceId: `choice-${turn}-a`, label: 'Follow the mysterious path', hint: 'A darker trail', icon: '🌿' },
            { choiceId: `choice-${turn}-b`, label: 'Talk to the wise elder', hint: 'Seek guidance', icon: '🧓' },
            { choiceId: `choice-${turn}-c`, label: 'Cross the river', hint: 'A brave move', icon: '🌊' },
          ],
      animationCues: [
        { timestampMs: 0, durationMs: 1500, type: 'expression', value: 'wonder', intensity: 0.8 },
        { timestampMs: 2000, durationMs: 2000, type: 'gesture', value: 'point_forward', intensity: 0.6 },
        { timestampMs: 5000, durationMs: 1000, type: 'expression', value: isEnding ? 'smile' : 'curious', intensity: 0.9 },
      ],
      subtitles: this.generateSubtitles(text),
      isEnding,
    };

    return {
      content: JSON.stringify(response),
      model: 'mock-v1',
      tokensUsed: text.length,
    };
  }

  private generateMockText(mode: string, turn: number, userInput: string): string {
    const modeTexts: Record<string, string[]> = {
      bedtime: [
        'The little rabbit hopped through the moonlit meadow, each soft step quieter than the last.',
        'Stars twinkled overhead like tiny lanterns hung by the wind itself.',
        'A gentle breeze carried the scent of jasmine as the forest creatures settled in for the night.',
      ],
      warrior_success: [
        'Arjun tightened his grip on the wooden training sword, eyes fixed on the target ahead.',
        'With a thunderous cry, the young warrior charged forward, determination blazing in every step.',
        'The crowd erupted in cheers as the final obstacle crumbled beneath sheer willpower.',
      ],
      mythology: [
        'Lord Ganesha sat beneath the great banyan tree, listening to the whispers of the ancient world.',
        'The river Saraswati shimmered as Sage Narada began his tale of the eternal dharma.',
        'In the golden kingdom of Lanka, a fateful decision was about to change the course of history.',
      ],
      motivation: [
        'Maya stared at the rejection letter, then slowly folded it and placed it on the growing stack.',
        'Every morning at 4 AM, the light in the small room flickered on — another day of relentless practice.',
        'The village laughed when she said she would study at IIT. She decided to let her results speak.',
      ],
    };

    const texts = modeTexts[mode] ?? modeTexts.bedtime;
    const base = texts[turn % texts.length];
    return `${base}\n\nThe path ahead seemed to respond to the choice: "${userInput}". What would happen next was anyone's guess, but the journey was far from over.`;
  }

  private generateSubtitles(text: string): Array<{ startMs: number; endMs: number; text: string }> {
    const words = text.split(/\s+/);
    const segments: Array<{ startMs: number; endMs: number; text: string }> = [];
    const wordsPerSegment = 7;
    let offsetMs = 0;

    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const chunk = words.slice(i, i + wordsPerSegment).join(' ');
      const duration = 2500;
      segments.push({ startMs: offsetMs, endMs: offsetMs + duration, text: chunk });
      offsetMs += duration;
    }

    return segments;
  }
}

@Injectable()
export class StoryLLMService {
  private readonly logger = new Logger(StoryLLMService.name);
  private backend: LLMBackend;

  constructor(private readonly config: ConfigService) {
    const provider = this.config.get<string>('app.aiProvider') ?? 'mock';
    this.backend = this.createBackend(provider);
    this.logger.log(`Story LLM backend: ${provider}`);
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<LLMGenerateResult> {
    return this.backend.generate(systemPrompt, userPrompt);
  }

  private createBackend(provider: string): LLMBackend {
    switch (provider) {
      case 'mock':
        return new MockLLMBackend();

      case 'openai':
        // TODO: return new OpenAILLMBackend(this.config);
        throw new Error('OpenAI backend not yet implemented');

      case 'anthropic':
        // TODO: return new AnthropicLLMBackend(this.config);
        throw new Error('Anthropic backend not yet implemented');

      default:
        this.logger.warn(`Unknown AI provider "${provider}", falling back to mock`);
        return new MockLLMBackend();
    }
  }
}
