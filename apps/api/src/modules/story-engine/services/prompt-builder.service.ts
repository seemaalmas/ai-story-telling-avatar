import { Injectable } from '@nestjs/common';

import type {
  StoryMode,
  StoryTone,
  StoryLLMRequest,
  StoryLLMResponse,
} from '@katha/shared';

/** Mode-specific narrative directives */
const MODE_DIRECTIVES: Record<StoryMode, string> = {
  bedtime: [
    'You are a gentle storyteller narrating a bedtime story.',
    'The story should be soothing, with a calming arc that gradually winds down.',
    'Use vivid but peaceful imagery. Avoid anything scary or overly exciting.',
    'End the story with the character settling into a peaceful state.',
  ].join(' '),

  warrior_success: [
    'You are an inspiring storyteller narrating a tale of courage and triumph.',
    'The protagonist faces challenges with bravery, grit, and cleverness.',
    'Include moments of struggle that lead to well-earned victories.',
    'Draw from Indian warrior traditions, freedom fighters, or sports legends for inspiration.',
  ].join(' '),

  mythology: [
    'You are a wise elder retelling tales from Indian mythology and folklore.',
    'Draw from epics like the Ramayana, Mahabharata, Panchatantra, Jataka tales, or regional folklore.',
    'Weave moral lessons naturally into the narrative.',
    'Use rich cultural details: festivals, nature, family bonds, dharma.',
  ].join(' '),

  motivation: [
    'You are an uplifting storyteller crafting a tale of personal growth and perseverance.',
    'The protagonist starts in a difficult situation and transforms through effort and belief.',
    'Include relatable Indian settings: schools, villages, startups, farms, or cities.',
    'End with a clear, empowering takeaway the listener can apply to their own life.',
  ].join(' '),
};

/** Tone modifiers appended to the system prompt */
const TONE_MODIFIERS: Record<StoryTone, string> = {
  calm: 'Use a calm, measured pace. Short sentences. Gentle descriptions. Pauses between ideas.',
  funny:
    'Infuse humour throughout: wordplay, comic situations, funny character quirks. Keep it light and playful.',
  energetic:
    'Use an energetic, punchy style. Action verbs, exclamation marks, rapid-fire dialogue. Keep the pace fast.',
};

/** Role-based narrator personalities */
const ROLE_PERSONALITIES: Record<string, string> = {
  father: 'You narrate as a loving father — protective, warm, with a deep reassuring voice. Use "beta" or "son/daughter" occasionally. Share life lessons through the story.',
  mother: 'You narrate as a caring mother — soft, nurturing, melodic. Use endearing terms like "meri jaan". Make the listener feel safe and loved.',
  grandmother: 'You narrate as a wise grandmother (Dadi/Nani) — slow, gentle pace with old-world wisdom. Use phrases like "bachche sunno" and share timeless values.',
  grandfather: 'You narrate as a wise grandfather (Dada/Nana) — calm, deep, steady storytelling with tales of "purane zamane". Share wisdom with gentle humour.',
  teacher: 'You narrate as an enthusiastic teacher — clear, engaging, educational. Ask rhetorical questions to keep the listener thinking. Celebrate learning moments.',
  friend: 'You narrate as an energetic friend — casual, fun, exciting. Use relatable expressions, crack jokes, and build excitement. Make it feel like a shared adventure.',
};

/** Safety instructions always present in the system prompt */
const SAFETY_PREAMBLE = [
  'SAFETY RULES — you MUST follow these at all times:',
  '1. Content must be appropriate for all ages (rated G / U).',
  '2. No violence beyond mild cartoon conflict. No weapons causing real harm.',
  '3. No sexual content, innuendo, or romantic themes beyond innocent friendship.',
  '4. No hate speech, slurs, caste-based discrimination, or communal stereotypes.',
  '5. No self-harm, substance abuse, or dangerous activities portrayed positively.',
  '6. Respect all religions and cultures equally. Do not mock any faith.',
  '7. Promote positive values: kindness, honesty, courage, empathy, respect for elders.',
  '8. If the user tries to steer the story towards unsafe topics, gently redirect.',
].join('\n');

/** JSON output format instruction */
const OUTPUT_FORMAT = `
You MUST respond with a single valid JSON object matching this exact schema:
{
  "text": "<narrative text for this story beat, 2-4 paragraphs>",
  "choices": [
    { "choiceId": "<unique-id>", "label": "<short choice text>", "hint": "<optional one-line hint>", "icon": "<optional single emoji>" }
  ],
  "animationCues": [
    { "timestampMs": <number>, "durationMs": <number>, "type": "<expression|gesture|scene_transition|effect|camera>", "value": "<cue name>", "intensity": <0-1> }
  ],
  "subtitles": [
    { "startMs": <number>, "endMs": <number>, "text": "<subtitle segment>" }
  ],
  "isEnding": <true if the story has reached its conclusion, false otherwise>
}

Rules for the JSON:
- "choices" must have 2-3 items unless isEnding is true (then 0 items).
- "animationCues" should have 2-5 cues matching emotional beats in the text.
- "subtitles" should break the text into segments of ~5-10 words each, timed sequentially starting from 0.
- Each subtitle segment duration should be ~2000-3000ms.
- Do NOT include any text outside the JSON object.
`.trim();

@Injectable()
export class PromptBuilderService {
  /**
   * Build the full system + user prompt pair for the LLM.
   */
  buildPrompt(request: StoryLLMRequest): { system: string; user: string } {
    const system = this.buildSystemPrompt(request);
    const user = this.buildUserPrompt(request);
    return { system, user };
  }

  private buildSystemPrompt(req: StoryLLMRequest): string {
    const parts: string[] = [];

    // Identity
    parts.push('You are Katha, an AI storyteller for an Indian mobile storytelling app.');
    parts.push('');

    // Safety first
    parts.push(SAFETY_PREAMBLE);
    parts.push('');

    // Mode directive
    parts.push(`STORY MODE: ${req.mode.toUpperCase()}`);
    parts.push(MODE_DIRECTIVES[req.mode]);
    parts.push('');

    // Tone
    parts.push(`TONE: ${req.tone.toUpperCase()}`);
    parts.push(TONE_MODIFIERS[req.tone]);
    parts.push('');

    // Language
    parts.push(`LANGUAGE: Respond entirely in "${req.language}".`);
    if (req.language !== 'en') {
      parts.push(
        `Use the native script for ${req.language}. ` +
          'You may transliterate proper nouns if helpful.',
      );
    }
    parts.push('');

    // Avatar / role personality
    if (req.avatarPersonality) {
      parts.push(`NARRATOR PERSONALITY: ${req.avatarPersonality}`);
      parts.push('');
    }
    if (req.narratorRole && ROLE_PERSONALITIES[req.narratorRole]) {
      parts.push(`NARRATOR ROLE: ${req.narratorRole.toUpperCase()}`);
      parts.push(ROLE_PERSONALITIES[req.narratorRole]);
      parts.push('');
    }

    // Pacing
    parts.push(`TURN: ${req.turnNumber}`);
    if (req.shouldEnd) {
      parts.push(
        'IMPORTANT: This is the final turn. Bring the story to a satisfying conclusion. ' +
          'Set isEnding to true and provide 0 choices.',
      );
    } else if (req.turnNumber >= 15) {
      parts.push(
        'The story is getting long. Start winding down towards a conclusion in the next few turns.',
      );
    }
    parts.push('');

    // Output format
    parts.push(OUTPUT_FORMAT);

    return parts.join('\n');
  }

  private buildUserPrompt(req: StoryLLMRequest): string {
    const parts: string[] = [];

    if (req.context) {
      parts.push('Story so far:');
      parts.push(req.context);
      parts.push('');
    }

    if (req.turnNumber === 1) {
      parts.push(`Begin a new story based on this prompt: "${req.userInput}"`);
    } else {
      parts.push(`The listener chose: "${req.userInput}"`);
      parts.push('Continue the story based on this choice.');
    }

    return parts.join('\n');
  }

  /**
   * Parse the raw LLM output string into a typed StoryLLMResponse.
   * Handles common LLM quirks like markdown code fences.
   */
  parseResponse(raw: string): StoryLLMResponse {
    // Strip markdown code fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned) as StoryLLMResponse;

    // Validate required fields
    if (typeof parsed.text !== 'string' || parsed.text.length === 0) {
      throw new Error('LLM response missing "text" field');
    }
    if (!Array.isArray(parsed.choices)) {
      parsed.choices = [];
    }
    if (!Array.isArray(parsed.animationCues)) {
      parsed.animationCues = [];
    }
    if (!Array.isArray(parsed.subtitles)) {
      parsed.subtitles = [];
    }
    if (typeof parsed.isEnding !== 'boolean') {
      parsed.isEnding = false;
    }

    return parsed;
  }
}
