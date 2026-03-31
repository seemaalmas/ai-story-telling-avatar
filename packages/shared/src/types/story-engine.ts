// ─── Story Engine Types ─────────────────────────────────────
// These types define the entire runtime contract for the
// interactive, branching story engine.

// ─── Enums / Literals ───────────────────────────────────────

export type StoryMode = 'bedtime' | 'warrior_success' | 'mythology' | 'motivation';
export type StoryTone = 'calm' | 'funny' | 'energetic';
// StoryStatus is exported from ./story.ts — do not re-export here

export type ModerationVerdict = 'pass' | 'flag' | 'block';

// ─── Story Session (Redis hot state) ───────────────────────

export interface StorySessionState {
  sessionId: string;
  userId: string;
  storyId: string;
  mode: StoryMode;
  tone: StoryTone;
  language: string;
  avatarId?: string;
  currentNodeId: string;
  /** Ordered list of node IDs the user has visited */
  path: string[];
  /** Accumulated story context for the LLM (rolling window) */
  context: string;
  /** Number of nodes generated so far */
  turnCount: number;
  /** Unix ms when the session was created */
  createdAt: number;
  /** Unix ms of last activity */
  lastActiveAt: number;
}

// ─── Story Node (single story beat) ────────────────────────

export interface StoryNode {
  nodeId: string;
  parentNodeId: string | null;
  /** The narrative text for this beat */
  text: string;
  /** Choices offered to the user to branch the story */
  choices: StoryChoice[];
  /** Visual / animation cues for the mobile avatar renderer */
  animationCues: AnimationCue[];
  /** Subtitle segments synced with narration timing */
  subtitles: SubtitleSegment[];
  /** Whether this node is a terminal (story ending) */
  isEnding: boolean;
  /** Metadata for analytics / debugging */
  meta: StoryNodeMeta;
}

export interface StoryChoice {
  choiceId: string;
  label: string;
  /** Short hint shown below the label */
  hint?: string;
  /** Emoji icon for the choice button */
  icon?: string;
}

export interface AnimationCue {
  /** Timestamp offset in ms from start of this node's narration */
  timestampMs: number;
  /** Duration of the animation in ms */
  durationMs: number;
  /** Type of cue the mobile renderer should handle */
  type: 'expression' | 'gesture' | 'scene_transition' | 'effect' | 'camera';
  /** Expression/gesture/effect name from the avatar rig */
  value: string;
  /** Optional intensity 0-1 */
  intensity?: number;
}

export interface SubtitleSegment {
  /** Start offset in ms */
  startMs: number;
  /** End offset in ms */
  endMs: number;
  /** The subtitle text */
  text: string;
}

export interface StoryNodeMeta {
  model?: string;
  tokensUsed?: number;
  generationMs?: number;
  moderationVerdict: ModerationVerdict;
}

// ─── Persistent Story Summary (Postgres) ───────────────────

export interface StorySessionSummary {
  id: string;
  sessionId: string;
  storyId: string;
  userId: string;
  mode: StoryMode;
  tone: StoryTone;
  language: string;
  totalTurns: number;
  /** Serialised path of node IDs */
  path: string[];
  /** Short AI-generated summary of the story played */
  summary?: string;
  startedAt: string;
  completedAt?: string;
}

// ─── LLM Request / Response ────────────────────────────────

export interface StoryLLMRequest {
  mode: StoryMode;
  tone: StoryTone;
  language: string;
  avatarPersonality?: string;
  /** Accumulated context from previous nodes */
  context: string;
  /** The user's selected choice label, or the initial prompt */
  userInput: string;
  /** Current turn number (1-based) */
  turnNumber: number;
  /** Whether the LLM should attempt to wrap up the story */
  shouldEnd: boolean;
}

/**
 * Structured output the LLM must return.
 * The prompt builder instructs the model to respond in this JSON shape.
 */
export interface StoryLLMResponse {
  text: string;
  choices: StoryChoice[];
  animationCues: AnimationCue[];
  subtitles: SubtitleSegment[];
  isEnding: boolean;
}

// ─── Moderation ────────────────────────────────────────────

export interface ModerationResult {
  verdict: ModerationVerdict;
  /** Categories that triggered a flag/block */
  categories: string[];
  /** Human-readable reason */
  reason?: string;
}

// ─── Story Seed (template for starting a story) ────────────

export interface StorySeed {
  id: string;
  mode: StoryMode;
  title: string;
  /** Localised titles keyed by language code */
  titleLocalized: Partial<Record<string, string>>;
  description: string;
  /** Initial system prompt fragment for this seed */
  openingPrompt: string;
  /** Suggested tones for this seed */
  suggestedTones: StoryTone[];
  /** Tags for discovery */
  tags: string[];
  /** Minimum recommended age */
  minAge?: number;
  /** Cover image URL */
  coverImageUrl?: string;
}

// ─── API DTOs (transport shapes) ───────────────────────────

export interface StartStoryInput {
  mode: StoryMode;
  tone: StoryTone;
  language: string;
  avatarId?: string;
  /** Initial prompt or seed ID */
  seedId?: string;
  prompt?: string;
}

export interface ContinueStoryInput {
  sessionId: string;
  choiceId: string;
}

export interface StoryNodeResponse {
  sessionId: string;
  node: StoryNode;
  turnCount: number;
  isEnding: boolean;
}

// ─── Re-exports of base story types ────────────────────────

export type { Story, CreateStoryInput, StoryListResponse } from './story';
