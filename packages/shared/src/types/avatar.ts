export interface Avatar {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  voiceId?: string;
  style?: Record<string, unknown>;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvatarInput {
  name: string;
  description?: string;
  imageUrl?: string;
  voiceId?: string;
  isPublic?: boolean;
}
