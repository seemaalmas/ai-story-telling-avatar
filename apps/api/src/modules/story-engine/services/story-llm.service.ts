import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LLMGenerateResult {
  content: string;
  model: string;
  tokensUsed: number;
}

export interface LLMBackend {
  generate(systemPrompt: string, userPrompt: string): Promise<LLMGenerateResult>;
}

class GrokLLMBackend implements LLMBackend {
  private readonly logger = new Logger('GrokLLMBackend');
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GROK_API_KEY') ?? '';
    this.model = config.get<string>('GROK_MODEL') ?? 'grok-3-mini-fast';
    this.baseUrl = config.get<string>('GROK_BASE_URL') ?? 'https://api.x.ai/v1';

    if (!this.apiKey) {
      throw new Error('GROK_API_KEY is required when AI_PROVIDER=grok');
    }
    this.logger.log(`Grok backend initialized (model=${this.model})`);
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<LLMGenerateResult> {
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2048,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      this.logger.error(`Grok API error ${res.status}: ${errText}`);
      throw new Error(`Grok API returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
      throw new Error('Grok API returned empty response');
    }

    return {
      content: choice.message.content,
      model: data.model ?? this.model,
      tokensUsed: data.usage?.total_tokens ?? 0,
    };
  }
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

      case 'grok':
        return new GrokLLMBackend(this.config);

      case 'openai':
        throw new Error('OpenAI backend not yet implemented');

      case 'anthropic':
        throw new Error('Anthropic backend not yet implemented');

      default:
        this.logger.warn(`Unknown AI provider "${provider}", falling back to mock`);
        return new MockLLMBackend();
    }
  }
}
