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
type Gender = 'male' | 'female';

interface VoiceProfile {
  rate: number;
  pitch: number;
  gender: Gender;
  volume: number;
}

const ROLE_VOICE_PROFILES: Record<NarratorRole, VoiceProfile> = {
  father:      { rate: 0.85, pitch: 0.75, gender: 'male',   volume: 1.0 },
  mother:      { rate: 0.88, pitch: 1.2,  gender: 'female', volume: 0.95 },
  grandmother: { rate: 0.72, pitch: 1.05, gender: 'female', volume: 0.9 },
  grandfather: { rate: 0.68, pitch: 0.6,  gender: 'male',   volume: 0.9 },
  teacher:     { rate: 0.95, pitch: 1.1,  gender: 'female', volume: 1.0 },
  friend:      { rate: 1.05, pitch: 1.15, gender: 'female', volume: 1.0 },
};

function getVoiceLang(lang: string): string {
  return LANG_MAP[lang] ?? lang;
}

function getVoiceProfile(role?: string | null): VoiceProfile {
  if (role && role in ROLE_VOICE_PROFILES) {
    return ROLE_VOICE_PROFILES[role as NarratorRole];
  }
  return { rate: 0.9, pitch: 1.0, gender: 'female', volume: 1.0 };
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
  return cachedVoices;
}

function pickVoice(lang: string, gender: Gender): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (voices.length === 0) return null;

  const voiceLang = getVoiceLang(lang);
  const langPrefix = lang.toLowerCase();

  const maleKeywords = ['male', 'man', 'guy', 'david', 'james', 'mark', 'daniel', 'rishi', 'kumar', 'rahul'];
  const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'susan', 'samantha', 'karen', 'priya', 'lekha', 'aditi'];

  function matchesGender(v: SpeechSynthesisVoice, g: Gender): boolean {
    const name = v.name.toLowerCase();
    const keywords = g === 'male' ? maleKeywords : femaleKeywords;
    if (keywords.some((k) => name.includes(k))) return true;
    const opposite = g === 'male' ? femaleKeywords : maleKeywords;
    if (opposite.some((k) => name.includes(k))) return false;
    return false;
  }

  const langMatches = voices.filter((v) => {
    const vl = v.lang.toLowerCase();
    return vl === voiceLang.toLowerCase() || vl.startsWith(langPrefix + '-') || vl === langPrefix;
  });

  if (langMatches.length > 0) {
    const genderMatch = langMatches.find((v) => matchesGender(v, gender));
    if (genderMatch) return genderMatch;
    return langMatches[0];
  }

  const enFallback = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (enFallback.length > 0) {
    const genderMatch = enFallback.find((v) => matchesGender(v, gender));
    if (genderMatch) return genderMatch;
    return enFallback[0];
  }

  return voices[0] ?? null;
}

let currentOnEnd: (() => void) | null = null;

export function speak(text: string, lang = 'en', role?: string | null, onEnd?: () => void): void {
  if (!text) return;

  const profile = getVoiceProfile(role);

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (cachedVoices.length === 0) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
        window.speechSynthesis.onvoiceschanged = null;
        speakWeb(text, lang, profile, onEnd);
      };
      speakWeb(text, lang, profile, onEnd);
    } else {
      speakWeb(text, lang, profile, onEnd);
    }
    return;
  }

  try {
    const Speech = require('expo-speech');
    Speech.stop();
    Speech.speak(text, {
      language: getVoiceLang(lang),
      rate: profile.rate,
      pitch: profile.pitch,
      onDone: onEnd,
      onStopped: onEnd,
    });
  } catch {
    // expo-speech not installed
  }
}

function speakWeb(text: string, lang: string, profile: VoiceProfile, onEnd?: () => void): void {
  const chunks = splitIntoEmotionalChunks(text);

  let chunkIndex = 0;
  currentOnEnd = onEnd ?? null;

  function speakNext() {
    if (chunkIndex >= chunks.length) {
      if (currentOnEnd) currentOnEnd();
      return;
    }

    const chunk = chunks[chunkIndex];
    chunkIndex++;

    if (chunk.type === 'pause') {
      setTimeout(speakNext, chunk.durationMs ?? 400);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.lang = getVoiceLang(lang);
    utterance.rate = profile.rate * (chunk.rateMultiplier ?? 1);
    utterance.pitch = profile.pitch * (chunk.pitchMultiplier ?? 1);
    utterance.volume = profile.volume;

    const voice = pickVoice(lang, profile.gender);
    if (voice) utterance.voice = voice;

    utterance.onend = speakNext;
    utterance.onerror = speakNext;

    window.speechSynthesis.speak(utterance);
  }

  speakNext();
}

interface SpeechChunk {
  type: 'speech' | 'pause';
  text: string;
  rateMultiplier?: number;
  pitchMultiplier?: number;
  durationMs?: number;
}

function splitIntoEmotionalChunks(text: string): SpeechChunk[] {
  const chunks: SpeechChunk[] = [];
  const sentences = text.split(/(?<=[.!?।\n])\s+/);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.includes('!') || trimmed.includes('!!')) {
      chunks.push({ type: 'speech', text: trimmed, rateMultiplier: 1.1, pitchMultiplier: 1.15 });
    } else if (trimmed.includes('?')) {
      chunks.push({ type: 'speech', text: trimmed, rateMultiplier: 0.95, pitchMultiplier: 1.1 });
    } else if (trimmed.includes('...') || trimmed.includes('—')) {
      const parts = trimmed.split(/(\.\.\.|—)/);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part) continue;
        if (part === '...' || part === '—') {
          chunks.push({ type: 'pause', text: '', durationMs: 500 });
        } else {
          chunks.push({ type: 'speech', text: part, rateMultiplier: 0.85, pitchMultiplier: 0.95 });
        }
      }
    } else if (trimmed.match(/^["""].*["""]$/)) {
      chunks.push({ type: 'speech', text: trimmed, rateMultiplier: 1.05, pitchMultiplier: 1.08 });
    } else {
      chunks.push({ type: 'speech', text: trimmed });
    }

    chunks.push({ type: 'pause', text: '', durationMs: 250 });
  }

  return chunks;
}

export function stopSpeaking(): void {
  currentOnEnd = null;

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
