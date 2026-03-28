# @katha/worker

BullMQ background job processor for the Katha AI platform.

## Structure

```
src/
├── processors/     # Job processor functions
│   └── story.processor.ts
├── queues/         # Queue definitions & helpers
│   └── story.queue.ts
└── main.ts         # Worker bootstrap
```

## Development

```bash
npm run dev          # Start with hot reload
```

## Queues

| Queue              | Purpose                              |
| ------------------ | ------------------------------------ |
| story-generation   | AI story content generation          |

## Configuration

- `REDIS_HOST` / `REDIS_PORT` - Redis connection
- `BULL_QUEUE_PREFIX` - Queue prefix (default: `katha`)
- `AI_PROVIDER` - Which AI provider to use

## Adding New Processors

1. Create a processor in `src/processors/`
2. Create a queue helper in `src/queues/`
3. Register the worker in `src/main.ts`
