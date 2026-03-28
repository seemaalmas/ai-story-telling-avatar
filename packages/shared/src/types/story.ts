export type StoryStatus = 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface Story {
  id: string;
  title: string;
  prompt: string;
  content?: string;
  language: string;
  status: StoryStatus;
  metadata?: Record<string, unknown>;
  duration?: number;
  audioUrl?: string;
  userId: string;
  avatarId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryInput {
  title: string;
  prompt: string;
  language?: string;
  avatarId?: string;
}

export interface StoryListResponse {
  data: Story[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
