export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type AuthProvider = 'EMAIL' | 'GOOGLE' | 'APPLE';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  authProvider: AuthProvider;
  preferredLanguage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferredLanguage: string;
  role: UserRole;
}
