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

function getVoiceLang(lang: string): string {
  return LANG_MAP[lang] ?? lang;
}

export function speak(text: string, lang = 'en'): void {
  if (!text) return;

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getVoiceLang(lang);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    return;
  }

  // On native, use expo-speech (lazy require so web bundle doesn't break)
  try {
    const Speech = require('expo-speech');
    Speech.stop();
    Speech.speak(text, {
      language: getVoiceLang(lang),
      rate: 0.9,
      pitch: 1.0,
    });
  } catch {
    // expo-speech not installed — silent fallback
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
