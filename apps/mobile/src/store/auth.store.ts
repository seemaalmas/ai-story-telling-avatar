import { create } from 'zustand';
import { secureStorage } from '@/utils/storage';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferredLanguage: string;
  role: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  setUser: (user: User) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setOnboardingComplete: () => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,

  setUser: async (user) => {
    await secureStorage.set('user', JSON.stringify(user));
    set({ user });
  },

  setTokens: async (accessToken, refreshToken) => {
    await secureStorage.set('accessToken', accessToken);
    await secureStorage.set('refreshToken', refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setOnboardingComplete: async () => {
    await secureStorage.set('onboardingComplete', 'true');
    set({ hasCompletedOnboarding: true });
  },

  logout: async () => {
    await secureStorage.remove('accessToken');
    await secureStorage.remove('refreshToken');
    await secureStorage.remove('user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    try {
      const accessToken = await secureStorage.get('accessToken');
      const refreshToken = await secureStorage.get('refreshToken');
      const onboarding = await secureStorage.get('onboardingComplete');
      const userJson = await secureStorage.get('user');

      let user: User | null = null;
      if (userJson) {
        try { user = JSON.parse(userJson); } catch { /* corrupted, ignore */ }
      }

      set({
        accessToken,
        refreshToken,
        user,
        isAuthenticated: !!accessToken,
        hasCompletedOnboarding: onboarding === 'true',
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
