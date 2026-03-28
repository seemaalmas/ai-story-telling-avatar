import { Module } from '@nestjs/common';
import { StoryEngineController } from './story-engine.controller';
import { StoryEngineService } from './services/story-engine.service';
import { RedisSessionStore } from './services/redis-session.store';
import { PromptBuilderService } from './services/prompt-builder.service';
import { ModerationService } from './services/moderation.service';
import { StoryLLMService } from './services/story-llm.service';
import { StorySeedService } from './services/story-seed.service';

@Module({
  controllers: [StoryEngineController],
  providers: [
    StoryEngineService,
    RedisSessionStore,
    PromptBuilderService,
    ModerationService,
    StoryLLMService,
    StorySeedService,
  ],
  exports: [StoryEngineService, RedisSessionStore],
})
export class StoryEngineModule {}
