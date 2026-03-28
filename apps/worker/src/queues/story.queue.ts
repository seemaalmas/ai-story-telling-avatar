import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { StoryJobData } from '../processors/story.processor';

let storyQueue: Queue<StoryJobData> | null = null;

export function getStoryQueue(): Queue<StoryJobData> {
  if (!storyQueue) {
    const connection = new IORedis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

    storyQueue = new Queue<StoryJobData>('story-generation', {
      connection,
      prefix: process.env.BULL_QUEUE_PREFIX ?? 'katha',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }

  return storyQueue;
}

export async function enqueueStoryGeneration(data: StoryJobData): Promise<string> {
  const queue = getStoryQueue();
  const job = await queue.add('generate', data, {
    priority: 1,
  });
  return job.id!;
}
