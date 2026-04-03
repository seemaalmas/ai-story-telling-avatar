import { create } from 'zustand';
import { secureStorage } from '@/utils/storage';

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
    await secureStorage.set('appLanguage', lang);
    set({ language: lang });
  },

  toggleFamilySafe: async () => {
    const next = !get().familySafeMode;
    await secureStorage.set('familySafe', next ? 'true' : 'false');
    set({ familySafeMode: next });
  },

  setPremium: (val) => set({ isPremium: val }),

  toggleNotifications: async () => {
    const next = !get().notificationsEnabled;
    await secureStorage.set('notifications', next ? 'true' : 'false');
    set({ notificationsEnabled: next });
  },

  hydrate: async () => {
    try {
      const lang = await secureStorage.get('appLanguage');
      const safe = await secureStorage.get('familySafe');
      const notif = await secureStorage.get('notifications');
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
