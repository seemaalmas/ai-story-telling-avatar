import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { StoryEngineService } from './services/story-engine.service';
import { StorySeedService } from './services/story-seed.service';
import {
  StartStoryDto,
  ContinueStoryDto,
  EndStoryDto,
  ListSessionsQueryDto,
} from './dto';

import type { StoryMode, StoryTone } from '@katha/shared';

@ApiTags('Story Engine')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('story-engine')
export class StoryEngineController {
  constructor(
    private readonly engine: StoryEngineService,
    private readonly seeds: StorySeedService,
  ) {}

  // ─── Start ────────────────────────────────────────────

  @Post('start')
  @ApiOperation({ summary: 'Start a new interactive story session' })
  @ApiResponse({ status: 201, description: 'Story session started, first node returned' })
  @ApiResponse({ status: 400, description: 'Invalid input or content blocked by moderation' })
  async start(
    @Req() req: { user: { id: string } },
    @Body() dto: StartStoryDto,
  ) {
    // If seedId provided, look up the seed prompt
    let prompt = dto.prompt;
    if (dto.seedId) {
      const seed = this.seeds.getSeedById(dto.seedId);
      if (seed) {
        prompt = seed.openingPrompt;
      }
    }

    return this.engine.startStory(req.user.id, {
      mode: dto.mode as StoryMode,
      tone: dto.tone as StoryTone,
      language: dto.language,
      avatarId: dto.avatarId,
      seedId: dto.seedId,
      prompt,
    });
  }

  // ─── Continue ─────────────────────────────────────────

  @Post('continue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Continue a story by selecting a choice' })
  @ApiResponse({ status: 200, description: 'Next story node returned' })
  @ApiResponse({ status: 404, description: 'Session not found or expired' })
  async continueStory(
    @Req() req: { user: { id: string } },
    @Body() dto: ContinueStoryDto,
  ) {
    return this.engine.continueStory(req.user.id, dto);
  }

  // ─── Get Session ──────────────────────────────────────

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get current state of a story session' })
  @ApiResponse({ status: 200, description: 'Session state with current node' })
  async getSession(
    @Req() req: { user: { id: string } },
    @Param('sessionId') sessionId: string,
  ) {
    return this.engine.getSession(req.user.id, sessionId);
  }

  // ─── End ──────────────────────────────────────────────

  @Post('end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a story session early' })
  @ApiResponse({ status: 200, description: 'Session ended and saved' })
  async endSession(
    @Req() req: { user: { id: string } },
    @Body() dto: EndStoryDto,
  ) {
    return this.engine.endSession(req.user.id, dto.sessionId);
  }

  // ─── History ──────────────────────────────────────────

  @Get('sessions')
  @ApiOperation({ summary: 'List past story sessions (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of story sessions' })
  async listSessions(
    @Req() req: { user: { id: string } },
    @Query() query: ListSessionsQueryDto,
  ) {
    return this.engine.listSessions(req.user.id, query.page, query.limit);
  }

  // ─── Seeds ────────────────────────────────────────────

  @Get('seeds')
  @ApiOperation({ summary: 'List available story seeds / templates' })
  @ApiResponse({ status: 200, description: 'All seeds returned' })
  async listSeeds() {
    return this.seeds.getAllSeeds();
  }

  @Get('seeds/:mode')
  @ApiOperation({ summary: 'List story seeds for a specific mode' })
  @ApiResponse({ status: 200, description: 'Seeds for the requested mode' })
  async listSeedsByMode(@Param('mode') mode: string) {
    return this.seeds.getSeedsByMode(mode as StoryMode);
  }
}
