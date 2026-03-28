import { Injectable } from '@nestjs/common';

import type { StorySeed, StoryMode } from '@katha/shared';

import { STORY_SEEDS } from '../seeds';

@Injectable()
export class StorySeedService {
  getAllSeeds(): StorySeed[] {
    return STORY_SEEDS;
  }

  getSeedsByMode(mode: StoryMode): StorySeed[] {
    return STORY_SEEDS.filter((s) => s.mode === mode);
  }

  getSeedById(id: string): StorySeed | undefined {
    return STORY_SEEDS.find((s) => s.id === id);
  }
}
