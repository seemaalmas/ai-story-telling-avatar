import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

import type { StorySessionState, StoryNode } from '@katha/shared';

const SESSION_PREFIX = 'story:session:';
const NODE_PREFIX = 'story:node:';

@Injectable()
export class RedisSessionStore implements OnModuleInit, OnModuleDestroy {
  private redis!: IORedis;
  private readonly logger = new Logger(RedisSessionStore.name);
  private ttlSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.ttlSeconds = 7200; // 2 hours default, overridden in onModuleInit
  }

  async onModuleInit() {
    const redisConfig = this.config.get('redis')!;
    this.ttlSeconds = this.config.get<number>('storyEngine.sessionTtlSeconds') ?? 7200;

    this.redis = new IORedis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    await this.redis.connect();
    this.logger.log('Redis session store connected');
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  // ─── Session CRUD ──────────────────────────────────────

  async saveSession(session: StorySessionState): Promise<void> {
    const key = SESSION_PREFIX + session.sessionId;
    await this.redis.set(key, JSON.stringify(session), 'EX', this.ttlSeconds);
  }

  async getSession(sessionId: string): Promise<StorySessionState | null> {
    const data = await this.redis.get(SESSION_PREFIX + sessionId);
    if (!data) return null;

    // Touch TTL on read
    await this.redis.expire(SESSION_PREFIX + sessionId, this.ttlSeconds);
    return JSON.parse(data) as StorySessionState;
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Delete session + all nodes
    const nodeKeys = await this.redis.keys(NODE_PREFIX + sessionId + ':*');
    const pipeline = this.redis.pipeline();
    pipeline.del(SESSION_PREFIX + sessionId);
    for (const k of nodeKeys) {
      pipeline.del(k);
    }
    await pipeline.exec();
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.redis.expire(SESSION_PREFIX + sessionId, this.ttlSeconds);
  }

  // ─── Node Storage ─────────────────────────────────────

  async saveNode(sessionId: string, node: StoryNode): Promise<void> {
    const key = NODE_PREFIX + sessionId + ':' + node.nodeId;
    await this.redis.set(key, JSON.stringify(node), 'EX', this.ttlSeconds);
  }

  async getNode(sessionId: string, nodeId: string): Promise<StoryNode | null> {
    const data = await this.redis.get(NODE_PREFIX + sessionId + ':' + nodeId);
    return data ? (JSON.parse(data) as StoryNode) : null;
  }

  async getAllNodes(sessionId: string): Promise<StoryNode[]> {
    const keys = await this.redis.keys(NODE_PREFIX + sessionId + ':*');
    if (keys.length === 0) return [];

    const values = await this.redis.mget(...keys);
    return values
      .filter((v): v is string => v !== null)
      .map((v) => JSON.parse(v) as StoryNode);
  }

  // ─── Utilities ─────────────────────────────────────────

  async sessionExists(sessionId: string): Promise<boolean> {
    return (await this.redis.exists(SESSION_PREFIX + sessionId)) === 1;
  }

  async getActiveSessions(userId: string): Promise<string[]> {
    // Scan for user's sessions (used sparingly -- admin/debugging)
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, found] = await this.redis.scan(
        cursor,
        'MATCH',
        SESSION_PREFIX + '*',
        'COUNT',
        100,
      );
      cursor = nextCursor;
      for (const k of found) {
        const data = await this.redis.get(k);
        if (data) {
          const session = JSON.parse(data) as StorySessionState;
          if (session.userId === userId) {
            keys.push(session.sessionId);
          }
        }
      }
    } while (cursor !== '0');

    return keys;
  }
}
