import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface SettingsState {
  language: string;
  familySafeMode: boolean;
  isPremium: boolean;
  notificationsEnabled: boolean;

  setLanguage: (lang: string) => Promise<void>;
  toggleFamilySafe: () => Promise<void>;
  setPremium: (val: boolean) => void;
  toggleNotifications: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'en',
  familySafeMode: true,
  isPremium: false,
  notificationsEnabled: true,

  setLanguage: async (lang) => {
    await SecureStore.setItemAsync('appLanguage', lang);
    set({ language: lang });
  },

  toggleFamilySafe: async () => {
    const next = !get().familySafeMode;
    await SecureStore.setItemAsync('familySafe', next ? 'true' : 'false');
    set({ familySafeMode: next });
  },

  setPremium: (val) => set({ isPremium: val }),

  toggleNotifications: async () => {
    const next = !get().notificationsEnabled;
    await SecureStore.setItemAsync('notifications', next ? 'true' : 'false');
    set({ notificationsEnabled: next });
  },

  hydrate: async () => {
    try {
      const lang = await SecureStore.getItemAsync('appLanguage');
      const safe = await SecureStore.getItemAsync('familySafe');
      const notif = await SecureStore.getItemAsync('notifications');
      set({
        language: lang ?? 'en',
        familySafeMode: safe !== 'false',
        notificationsEnabled: notif !== 'false',
      });
    } catch {
      // defaults are fine
    }
  },
}));
