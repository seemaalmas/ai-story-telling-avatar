import { Injectable, Logger } from '@nestjs/common';

import type { ModerationResult, ModerationVerdict } from '@katha/shared';

/**
 * Blocked patterns for pre-check (user input) and post-check (LLM output).
 * These are simple regex-based heuristics. In production, layer an
 * ML-based moderation API (OpenAI moderation, Perspective API, etc.) on top.
 */
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\b(kill|murder|suicide|self[- ]?harm)\b/i, category: 'violence_graphic' },
  { pattern: /\b(sex|porn|nude|naked|erotic)\b/i, category: 'sexual' },
  { pattern: /\b(slur|nigger|faggot|retard)\b/i, category: 'hate_speech' },
  { pattern: /\b(bomb|terrorist|jihad)\b/i, category: 'dangerous_content' },
  {
    pattern: /\b(caste[- ]?system|untouchable|dalit.*inferior|brahmin.*superior)\b/i,
    category: 'hate_speech',
  },
];

/**
 * Flagged patterns — don't block, but flag for review.
 */
const FLAGGED_PATTERNS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\b(fight|battle|sword|blood)\b/i, category: 'mild_violence' },
  { pattern: /\b(alcohol|wine|beer|drink)\b/i, category: 'substance_reference' },
  { pattern: /\b(gun|pistol|rifle)\b/i, category: 'weapon_reference' },
];

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  /**
   * Pre-check: validate user input BEFORE sending to the LLM.
   * This is cheap and fast — runs on every request.
   */
  preCheck(text: string): ModerationResult {
    return this.check(text, 'pre-check');
  }

  /**
   * Post-check: validate LLM output BEFORE sending to the client.
   * Catches hallucinated unsafe content.
   */
  postCheck(text: string): ModerationResult {
    return this.check(text, 'post-check');
  }

  private check(text: string, phase: string): ModerationResult {
    const blockedCategories: string[] = [];
    const flaggedCategories: string[] = [];

    for (const { pattern, category } of BLOCKED_PATTERNS) {
      if (pattern.test(text)) {
        blockedCategories.push(category);
      }
    }

    if (blockedCategories.length > 0) {
      this.logger.warn(
        `Moderation ${phase} BLOCKED: categories=[${blockedCategories.join(',')}]`,
      );
      return {
        verdict: 'block',
        categories: blockedCategories,
        reason: `Content blocked due to: ${blockedCategories.join(', ')}`,
      };
    }

    for (const { pattern, category } of FLAGGED_PATTERNS) {
      if (pattern.test(text)) {
        flaggedCategories.push(category);
      }
    }

    if (flaggedCategories.length > 0) {
      this.logger.log(
        `Moderation ${phase} FLAGGED: categories=[${flaggedCategories.join(',')}]`,
      );
      return {
        verdict: 'flag',
        categories: flaggedCategories,
        reason: `Content flagged for review: ${flaggedCategories.join(', ')}`,
      };
    }

    return { verdict: 'pass', categories: [] };
  }

  /**
   * Return a safe, pre-canned response when moderation blocks content.
   * Used as a fallback instead of returning nothing.
   */
  getSafeRedirect(language: string): string {
    const redirects: Record<string, string> = {
      en: "Let's take the story in a different direction! How about we follow our hero on a new adventure?",
      hi: 'चलिए कहानी को एक नई दिशा में ले चलते हैं! कैसा रहे अगर हमारा नायक एक नए रोमांच पर निकले?',
      ta: 'கதையை வேறு திசையில் எடுத்துச் செல்வோம்! நமது கதாநாயகன் புதிய சாகசத்தில் செல்வது எப்படி?',
      te: 'కథను వేరే దిశలో తీసుకెళ్దాం! మన హీరో కొత్త సాహసంలో బయలుదేరడం ఎలా?',
      bn: 'চলো গল্পটাকে অন্য দিকে নিয়ে যাই! আমাদের নায়ক একটি নতুন অভিযানে যাক কেমন?',
      mr: 'चला कथेला वेगळ्या दिशेने नेऊया! आपला नायक नवीन साहसावर निघाला तर?',
      kn: 'ಕಥೆಯನ್ನು ಬೇರೆ ದಿಕ್ಕಿನಲ್ಲಿ ತೆಗೆದುಕೊಂಡು ಹೋಗೋಣ! ನಮ್ಮ ನಾಯಕ ಹೊಸ ಸಾಹಸಕ್ಕೆ ಹೊರಟರೆ ಹೇಗೆ?',
    };
    return redirects[language] ?? redirects.en;
  }
}
