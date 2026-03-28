# @katha/ai-providers

Pluggable AI provider interfaces for the Katha platform. Defines contracts for story generation, text-to-speech, avatar image generation, and translation.

## Provider Interface

```typescript
interface AIProvider {
  name: string;
  generateStory(input: StoryGenerationInput): Promise<StoryGenerationOutput>;
  generateSpeech?(input: TextToSpeechInput): Promise<TextToSpeechOutput>;
  generateAvatarImage?(input: AvatarImageInput): Promise<AvatarImageOutput>;
  translate?(input: TranslationInput): Promise<TranslationOutput>;
  healthCheck(): Promise<boolean>;
}
```

## Available Providers

| Provider   | Status          |
| ---------- | --------------- |
| `mock`     | Implemented     |
| `openai`   | Interface only  |
| `anthropic`| Interface only  |
| `google`   | Interface only  |

## Usage

```typescript
import { AIProviderFactory } from '@katha/ai-providers';

const provider = AIProviderFactory.create('mock');
const story = await provider.generateStory({
  prompt: 'A brave tiger in the Sundarbans',
  language: 'hi',
});
```

## Adding a New Provider

1. Create `src/providers/your-provider.ts` implementing `AIProvider`
2. Register in `src/factory.ts`
3. Export from `src/index.ts`
