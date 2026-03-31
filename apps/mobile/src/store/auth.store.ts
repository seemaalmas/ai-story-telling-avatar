import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

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
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user });
  },

  setTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setOnboardingComplete: async () => {
    await SecureStore.setItemAsync('onboardingComplete', 'true');
    set({ hasCompletedOnboarding: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const onboarding = await SecureStore.getItemAsync('onboardingComplete');
      const userJson = await SecureStore.getItemAsync('user');

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
