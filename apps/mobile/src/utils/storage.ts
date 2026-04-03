import { Platform } from 'react-native';

// Web-safe storage wrapper: uses SecureStore on native, localStorage on web
const webStorage = {
  async get(key: string): Promise<string | null> {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  },
  async set(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};

let nativeStorage = webStorage; // fallback
if (Platform.OS !== 'web') {
  // Dynamic import only on native platforms
  const SecureStore = require('expo-secure-store');
  nativeStorage = {
    get: (key: string) => SecureStore.getItemAsync(key),
    set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    remove: (key: string) => SecureStore.deleteItemAsync(key),
  };
}

export const secureStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
