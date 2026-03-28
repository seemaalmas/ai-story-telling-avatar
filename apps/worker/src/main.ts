import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { storyProcessor } from './processors/story.processor';

const connection = new IORedis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const prefix = process.env.BULL_QUEUE_PREFIX ?? 'katha';

const storyWorker = new Worker('story-generation', storyProcessor, {
  connection,
  prefix,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 60000,
  },
});

storyWorker.on('completed', (job) => {
  console.log(`Story job ${job.id} completed`);
});

storyWorker.on('failed', (job, err) => {
  console.error(`Story job ${job?.id} failed:`, err.message);
});

console.log('Katha worker started. Listening for jobs...');

const shutdown = async () => {
  console.log('Shutting down worker...');
  await storyWorker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
