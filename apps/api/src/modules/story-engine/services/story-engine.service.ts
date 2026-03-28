import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../../prisma/prisma.service';
import { RedisSessionStore } from './redis-session.store';
import { PromptBuilderService } from './prompt-builder.service';
import { ModerationService } from './moderation.service';
import { StoryLLMService } from './story-llm.service';

import type {
  StorySessionState,
  StoryNode,
  StoryLLMRequest,
  StoryNodeResponse,
  StartStoryInput,
  ContinueStoryInput,
  StoryMode,
  StoryTone,
} from '@katha/shared';

import { STORY_ENGINE_DEFAULTS } from '@katha/shared';

@Injectable()
export class StoryEngineService {
  private readonly logger = new Logger(StoryEngineService.name);
  private readonly maxTurns: number;
  private readonly windDownTurn: number;
  private readonly maxContextChars: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisStore: RedisSessionStore,
    private readonly promptBuilder: PromptBuilderService,
    private readonly moderation: ModerationService,
    private readonly llm: StoryLLMService,
    private readonly config: ConfigService,
  ) {
    this.maxTurns = this.config.get<number>('storyEngine.maxTurns') ?? STORY_ENGINE_DEFAULTS.maxTurns;
    this.windDownTurn = this.config.get<number>('storyEngine.windDownTurn') ?? STORY_ENGINE_DEFAULTS.windDownTurn;
    this.maxContextChars = this.config.get<number>('storyEngine.maxContextChars') ?? STORY_ENGINE_DEFAULTS.maxContextChars;
  }

  // ─── Start a new story session ─────────────────────────

  async startStory(userId: string, input: StartStoryInput): Promise<StoryNodeResponse> {
    const userPrompt = input.prompt ?? 'Tell me an amazing story';

    // Pre-check user input
    const preCheck = this.moderation.preCheck(userPrompt);
    if (preCheck.verdict === 'block') {
      throw new BadRequestException(preCheck.reason);
    }

    // Create the persistent Story record
    const story = await this.prisma.story.create({
      data: {
        title: userPrompt.slice(0, 100),
        prompt: userPrompt,
        language: input.language,
        status: 'GENERATING',
        userId,
        avatarId: input.avatarId ?? null,
        metadata: { mode: input.mode, tone: input.tone, seedId: input.seedId },
      },
    });

    // Build session state
    const sessionId = randomUUID();
    const rootNodeId = randomUUID();

    const session: StorySessionState = {
      sessionId,
      userId,
      storyId: story.id,
      mode: input.mode,
      tone: input.tone,
      language: input.language,
      avatarId: input.avatarId,
      currentNodeId: rootNodeId,
      path: [],
      context: '',
      turnCount: 0,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    // Generate the first node
    const node = await this.generateNode(session, userPrompt, rootNodeId, null);

    // Update session state
    session.currentNodeId = node.nodeId;
    session.path.push(node.nodeId);
    session.context = this.appendContext(session.context, node.text);
    session.turnCount = 1;

    // Persist
    await this.redisStore.saveSession(session);
    await this.redisStore.saveNode(sessionId, node);

    // Create persistent session record
    await this.prisma.storySession.create({
      data: {
        sessionId,
        storyId: story.id,
        userId,
        mode: this.toPrismaMode(input.mode),
        tone: this.toPrismaTone(input.tone),
        language: input.language,
        totalTurns: 1,
        path: [node.nodeId],
      },
    });

    this.logger.log(`Story session started: ${sessionId} (mode=${input.mode}, tone=${input.tone})`);

    return {
      sessionId,
      node,
      turnCount: 1,
      isEnding: node.isEnding,
    };
  }

  // ─── Continue a story with a choice ────────────────────

  async continueStory(userId: string, input: ContinueStoryInput): Promise<StoryNodeResponse> {
    const session = await this.redisStore.getSession(input.sessionId);
    if (!session) {
      throw new NotFoundException('Story session not found or expired');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Not your story session');
    }

    // Get the current node to find the chosen choice
    const currentNode = await this.redisStore.getNode(session.sessionId, session.currentNodeId);
    if (!currentNode) {
      throw new NotFoundException('Current story node not found');
    }

    const choice = currentNode.choices.find((c) => c.choiceId === input.choiceId);
    if (!choice) {
      throw new BadRequestException('Invalid choice ID');
    }

    // Pre-check the choice label (unlikely to be unsafe, but defense in depth)
    const preCheck = this.moderation.preCheck(choice.label);
    if (preCheck.verdict === 'block') {
      throw new BadRequestException(preCheck.reason);
    }

    const newTurn = session.turnCount + 1;
    const shouldEnd = newTurn >= this.maxTurns;
    const newNodeId = randomUUID();

    // Generate the next node
    const node = await this.generateNode(
      { ...session, turnCount: newTurn },
      choice.label,
      newNodeId,
      session.currentNodeId,
      shouldEnd,
    );

    // Update session
    session.currentNodeId = node.nodeId;
    session.path.push(node.nodeId);
    session.context = this.appendContext(session.context, node.text);
    session.turnCount = newTurn;
    session.lastActiveAt = Date.now();

    await this.redisStore.saveSession(session);
    await this.redisStore.saveNode(session.sessionId, node);

    // Update persistent record
    await this.prisma.storySession.updateMany({
      where: { sessionId: session.sessionId },
      data: {
        totalTurns: newTurn,
        path: session.path,
        ...(node.isEnding ? { completedAt: new Date() } : {}),
      },
    });

    // If story ended, mark the Story as completed
    if (node.isEnding) {
      await this.finalizeSession(session);
    }

    return {
      sessionId: session.sessionId,
      node,
      turnCount: newTurn,
      isEnding: node.isEnding,
    };
  }

  // ─── Get current session state ─────────────────────────

  async getSession(userId: string, sessionId: string) {
    const session = await this.redisStore.getSession(sessionId);
    if (!session) {
      throw new NotFoundException('Story session not found or expired');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Not your story session');
    }

    const currentNode = await this.redisStore.getNode(sessionId, session.currentNodeId);

    return {
      sessionId: session.sessionId,
      storyId: session.storyId,
      mode: session.mode,
      tone: session.tone,
      language: session.language,
      turnCount: session.turnCount,
      currentNode,
    };
  }

  // ─── End a session early ───────────────────────────────

  async endSession(userId: string, sessionId: string): Promise<{ message: string }> {
    const session = await this.redisStore.getSession(sessionId);
    if (!session) {
      throw new NotFoundException('Story session not found or expired');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Not your story session');
    }

    await this.finalizeSession(session);
    return { message: 'Story session ended' };
  }

  // ─── List completed story sessions ─────────────────────

  async listSessions(userId: string, page = 1, limit = 20) {
    const [sessions, total] = await Promise.all([
      this.prisma.storySession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          sessionId: true,
          mode: true,
          tone: true,
          language: true,
          totalTurns: true,
          summary: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      this.prisma.storySession.count({ where: { userId } }),
    ]);

    return { data: sessions, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ─── Private Helpers ───────────────────────────────────

  private async generateNode(
    session: StorySessionState & { turnCount: number },
    userInput: string,
    nodeId: string,
    parentNodeId: string | null,
    forceEnd = false,
  ): Promise<StoryNode> {
    const shouldEnd = forceEnd || session.turnCount >= this.maxTurns;

    const llmRequest: StoryLLMRequest = {
      mode: session.mode,
      tone: session.tone,
      language: session.language,
      context: session.context,
      userInput,
      turnNumber: session.turnCount + 1,
      shouldEnd,
    };

    const { system, user } = this.promptBuilder.buildPrompt(llmRequest);

    const startMs = Date.now();
    const rawResponse = await this.llm.generate(system, user);
    const generationMs = Date.now() - startMs;

    let parsed = this.promptBuilder.parseResponse(rawResponse.content);

    // Post-check moderation on the generated text
    const postCheck = this.moderation.postCheck(parsed.text);

    if (postCheck.verdict === 'block') {
      this.logger.warn(`Post-check blocked story node, using safe redirect`);
      const safeText = this.moderation.getSafeRedirect(session.language);
      parsed = {
        text: safeText,
        choices: [
          { choiceId: randomUUID(), label: 'Continue the adventure' },
          { choiceId: randomUUID(), label: 'Try a different path' },
        ],
        animationCues: [
          { timestampMs: 0, durationMs: 2000, type: 'expression', value: 'thinking', intensity: 0.7 },
        ],
        subtitles: [{ startMs: 0, endMs: 3000, text: safeText }],
        isEnding: false,
      };
    }

    // Force ending when at max turns
    if (shouldEnd && !parsed.isEnding) {
      parsed.isEnding = true;
      parsed.choices = [];
    }

    const node: StoryNode = {
      nodeId,
      parentNodeId,
      text: parsed.text,
      choices: parsed.choices,
      animationCues: parsed.animationCues,
      subtitles: parsed.subtitles,
      isEnding: parsed.isEnding,
      meta: {
        model: rawResponse.model,
        tokensUsed: rawResponse.tokensUsed,
        generationMs,
        moderationVerdict: postCheck.verdict,
      },
    };

    return node;
  }

  private async finalizeSession(session: StorySessionState): Promise<void> {
    // Collect all nodes for summary
    const nodes = await this.redisStore.getAllNodes(session.sessionId);
    const fullText = nodes
      .sort((a, b) => {
        const ai = session.path.indexOf(a.nodeId);
        const bi = session.path.indexOf(b.nodeId);
        return ai - bi;
      })
      .map((n) => n.text)
      .join('\n\n');

    // Update persistent records
    await this.prisma.storySession.updateMany({
      where: { sessionId: session.sessionId },
      data: {
        completedAt: new Date(),
        summary: fullText.slice(0, 2000),
        nodes: nodes.map((n) => ({ nodeId: n.nodeId, text: n.text.slice(0, 200) })),
      },
    });

    await this.prisma.story.update({
      where: { id: session.storyId },
      data: {
        status: 'COMPLETED',
        content: fullText,
      },
    });

    // Clean up Redis
    await this.redisStore.deleteSession(session.sessionId);

    this.logger.log(`Story session finalized: ${session.sessionId} (${session.turnCount} turns)`);
  }

  private appendContext(existing: string, newText: string): string {
    const combined = existing ? existing + '\n\n' + newText : newText;
    if (combined.length > this.maxContextChars) {
      return combined.slice(combined.length - this.maxContextChars);
    }
    return combined;
  }

  private toPrismaMode(mode: StoryMode) {
    return mode.toUpperCase() as 'BEDTIME' | 'WARRIOR_SUCCESS' | 'MYTHOLOGY' | 'MOTIVATION';
  }

  private toPrismaTone(tone: StoryTone) {
    return tone.toUpperCase() as 'CALM' | 'FUNNY' | 'ENERGETIC';
  }
}
