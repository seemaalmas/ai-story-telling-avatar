import { AIProvider, AIProviderConfig } from './interfaces';
import { MockAIProvider } from './providers/mock.provider';

export type ProviderType = 'mock' | 'grok' | 'openai' | 'anthropic' | 'google';

/**
 * Factory for creating AI provider instances.
 *
 * Usage:
 *   const provider = AIProviderFactory.create('mock');
 *   const story = await provider.generateStory({ prompt: '...', language: 'hi' });
 *
 * To add a new provider:
 *   1. Create a new class implementing AIProvider in ./providers/
 *   2. Register it in the switch statement below
 */
export class AIProviderFactory {
  static create(type: ProviderType, _config?: AIProviderConfig): AIProvider {
    switch (type) {
      case 'mock':
        return new MockAIProvider();

      case 'openai':
        // TODO: Implement OpenAI provider
        // return new OpenAIProvider(config);
        throw new Error('OpenAI provider not yet implemented. Use "mock" for development.');

      case 'anthropic':
        // TODO: Implement Anthropic provider
        // return new AnthropicProvider(config);
        throw new Error('Anthropic provider not yet implemented. Use "mock" for development.');

      case 'google':
        // TODO: Implement Google AI provider
        // return new GoogleAIProvider(config);
        throw new Error('Google AI provider not yet implemented. Use "mock" for development.');

      default:
        throw new Error(`Unknown AI provider type: ${type}`);
    }
  }
}
