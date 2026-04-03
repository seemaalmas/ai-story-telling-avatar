import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { ConsentModule } from './modules/consent/consent.module';
import { StoriesModule } from './modules/stories/stories.module';
import { StoryEngineModule } from './modules/story-engine/story-engine.module';
import { AvatarsModule } from './modules/avatars/avatars.module';
import { VoicePipelineModule } from './modules/voice-pipeline/voice-pipeline.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { appConfig, databaseConfig, authConfig, redisConfig, storyEngineConfig, voiceConfig, subscriptionConfig } from './config';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, redisConfig, storyEngineConfig, voiceConfig, subscriptionConfig],
      envFilePath: [
        '.env.local',
        '.env',
        '.env.development',
        // Also check monorepo root for env files
        path.resolve(__dirname, '../../../.env.local'),
        path.resolve(__dirname, '../../../.env'),
        path.resolve(__dirname, '../../../.env.development'),
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PreferencesModule,
    ConsentModule,
    StoriesModule,
    StoryEngineModule,
    AvatarsModule,
    VoicePipelineModule,
    SubscriptionModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
