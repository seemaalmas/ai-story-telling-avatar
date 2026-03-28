import { Job } from 'bullmq';

export interface StoryJobData {
  storyId: string;
  userId: string;
  prompt: string;
  language: string;
  avatarId?: string;
}

export async function storyProcessor(job: Job<StoryJobData>): Promise<void> {
  const { storyId, prompt, language } = job.data;

  console.log(`Processing story ${storyId}: "${prompt}" in ${language}`);

  await job.updateProgress(10);

  // TODO: Use AI provider interface to generate story content
  // const aiProvider = AIProviderFactory.create(process.env.AI_PROVIDER);
  // const content = await aiProvider.generateStory({ prompt, language });

  await job.updateProgress(50);

  // TODO: Update story in database with generated content
  // await prisma.story.update({ where: { id: storyId }, data: { content, status: 'COMPLETED' } });

  await job.updateProgress(100);

  console.log(`Story ${storyId} generation complete`);
}
