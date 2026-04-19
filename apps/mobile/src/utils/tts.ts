import { Platform } from 'react-native';

const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  kn: 'kn-IN',
  gu: 'gu-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
};

type NarratorRole = 'father' | 'mother' | 'grandmother' | 'grandfather' | 'teacher' | 'friend';

interface VoiceProfile {
  rate: number;
  pitch: number;
}

const ROLE_VOICE_PROFILES: Record<NarratorRole, VoiceProfile> = {
  father: { rate: 0.85, pitch: 0.8 },
  mother: { rate: 0.9, pitch: 1.15 },
  grandmother: { rate: 0.75, pitch: 0.95 },
  grandfather: { rate: 0.7, pitch: 0.7 },
  teacher: { rate: 0.95, pitch: 1.05 },
  friend: { rate: 1.05, pitch: 1.1 },
};

function getVoiceLang(lang: string): string {
  return LANG_MAP[lang] ?? lang;
}

function getVoiceProfile(role?: string | null): VoiceProfile {
  if (role && role in ROLE_VOICE_PROFILES) {
    return ROLE_VOICE_PROFILES[role as NarratorRole];
  }
  return { rate: 0.9, pitch: 1.0 };
}

export function speak(text: string, lang = 'en', role?: string | null): void {
  if (!text) return;

  const profile = getVoiceProfile(role);

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getVoiceLang(lang);
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    window.speechSynthesis.speak(utterance);
    return;
  }

  try {
    const Speech = require('expo-speech');
    Speech.stop();
    Speech.speak(text, {
      language: getVoiceLang(lang),
      rate: profile.rate,
      pitch: profile.pitch,
    });
  } catch {
    // expo-speech not installed
  }
}

export function stopSpeaking(): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return;
  }

  try {
    const Speech = require('expo-speech');
    Speech.stop();
  } catch {
    // silent fallback
  }
}
