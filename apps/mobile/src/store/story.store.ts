import { create } from 'zustand';

type StoryMode = 'bedtime' | 'warrior_success' | 'mythology' | 'motivation';
type StoryTone = 'calm' | 'funny' | 'energetic';
type NarratorRole = 'father' | 'mother' | 'grandmother' | 'grandfather' | 'teacher' | 'friend';

interface PresetAvatar {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface StoryChoice {
  choiceId: string;
  label: string;
  hint?: string;
  icon?: string;
}

interface SubtitleSegment {
  startMs: number;
  endMs: number;
  text: string;
}

interface AnimationCue {
  timestampMs: number;
  durationMs: number;
  type: string;
  value: string;
  intensity?: number;
}

interface StoryNode {
  nodeId: string;
  text: string;
  choices: StoryChoice[];
  animationCues: AnimationCue[];
  subtitles: SubtitleSegment[];
  isEnding: boolean;
}

interface StoryState {
  // ── Session config ────────────────────
  sessionId: string | null;
  mode: StoryMode | null;
  tone: StoryTone | null;
  language: string;
  avatarId: string | null;
  avatarEmoji: string;
  avatarName: string;
  customImageUri: string | null;
  narratorRole: NarratorRole | null;
  seedId: string | null;
  prompt: string;

  // ── Playback ──────────────────────────
  currentNode: StoryNode | null;
  turnCount: number;
  isPlaying: boolean;
  isGenerating: boolean;
  currentSubtitleIndex: number;
  elapsedMs: number;
  error: string | null;

  // ── Actions ───────────────────────────
  setConfig: (cfg: {
    mode: StoryMode;
    tone: StoryTone;
    language: string;
    avatarId?: string;
    seedId?: string;
    prompt?: string;
  }) => void;
  setAvatar: (avatar: { id: string; emoji: string; name: string; customImageUri?: string }) => void;
  setNarratorRole: (role: NarratorRole) => void;
  setLanguage: (language: string) => void;
  setSession: (sessionId: string, node: StoryNode, turnCount: number) => void;
  setCurrentNode: (node: StoryNode, turnCount: number) => void;
  setPlaying: (playing: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setSubtitleIndex: (index: number) => void;
  setElapsedMs: (ms: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const INITIAL = {
  sessionId: null,
  mode: null,
  tone: null,
  language: 'en',
  avatarId: null,
  avatarEmoji: '🧙',
  avatarName: '',
  customImageUri: null,
  narratorRole: null,
  seedId: null,
  prompt: '',
  currentNode: null,
  turnCount: 0,
  isPlaying: false,
  isGenerating: false,
  currentSubtitleIndex: 0,
  elapsedMs: 0,
  error: null,
};

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'dadi', name: 'Dadi', emoji: '👵', description: 'Wise grandmother with tales of old' },
  { id: 'guru', name: 'Guru Ji', emoji: '🧙', description: 'Mystic sage with ancient wisdom' },
  { id: 'rani', name: 'Rani', emoji: '👸', description: 'Young princess, bold and curious' },
  { id: 'kavi', name: 'Kavi', emoji: '👦', description: 'Adventurous boy with big dreams' },
  { id: 'maya', name: 'Maya', emoji: '👩‍🏫', description: 'Inspiring teacher who loves stories' },
  { id: 'baba', name: 'Baba Ji', emoji: '👴', description: 'Gentle grandfather with warm tales' },
  { id: 'veera', name: 'Veera', emoji: '🦸‍♀️', description: 'Fearless warrior with a golden heart' },
  { id: 'chotu', name: 'Chotu', emoji: '🐒', description: 'Mischievous monkey friend' },
];

export const NARRATOR_ROLES: { key: NarratorRole; label: string; emoji: string; voiceHint: string }[] = [
  { key: 'father', label: 'Father', emoji: '👨', voiceHint: 'Deep, warm, protective' },
  { key: 'mother', label: 'Mother', emoji: '👩', voiceHint: 'Soft, nurturing, melodic' },
  { key: 'grandmother', label: 'Grandmother', emoji: '👵', voiceHint: 'Gentle, wise, slow-paced' },
  { key: 'grandfather', label: 'Grandfather', emoji: '👴', voiceHint: 'Deep, calm, storytelling' },
  { key: 'teacher', label: 'Teacher', emoji: '👩‍🏫', voiceHint: 'Clear, engaging, enthusiastic' },
  { key: 'friend', label: 'Friend', emoji: '🧑', voiceHint: 'Energetic, fun, casual' },
];

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

export const useStoryStore = create<StoryState>((set) => ({
  ...INITIAL,

  setConfig: (cfg) =>
    set({
      mode: cfg.mode,
      tone: cfg.tone,
      language: cfg.language,
      avatarId: cfg.avatarId ?? null,
      seedId: cfg.seedId ?? null,
      prompt: cfg.prompt ?? '',
    }),

  setAvatar: (avatar) =>
    set({
      avatarId: avatar.id,
      avatarEmoji: avatar.emoji,
      avatarName: avatar.name,
      customImageUri: avatar.customImageUri ?? null,
    }),

  setNarratorRole: (role) => set({ narratorRole: role }),

  setLanguage: (language) => set({ language }),

  setSession: (sessionId, node, turnCount) =>
    set({ sessionId, currentNode: node, turnCount, isGenerating: false, error: null }),

  setCurrentNode: (node, turnCount) =>
    set({
      currentNode: node,
      turnCount,
      isGenerating: false,
      currentSubtitleIndex: 0,
      elapsedMs: 0,
      error: null,
    }),

  setPlaying: (playing) => set({ isPlaying: playing }),
  setGenerating: (generating) => set({ isGenerating: generating }),
  setSubtitleIndex: (index) => set({ currentSubtitleIndex: index }),
  setElapsedMs: (ms) => set({ elapsedMs: ms }),
  setError: (error) => set({ error, isGenerating: false }),
  reset: () => set(INITIAL),
}));
