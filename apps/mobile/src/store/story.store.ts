import { create } from 'zustand';

type StoryMode = 'bedtime' | 'warrior_success' | 'mythology' | 'motivation';
type StoryTone = 'calm' | 'funny' | 'energetic';

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
