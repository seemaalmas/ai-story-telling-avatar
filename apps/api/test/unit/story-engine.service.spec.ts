import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { StoryEngineService } from '../../src/modules/story-engine/services/story-engine.service';
import { RedisSessionStore } from '../../src/modules/story-engine/services/redis-session.store';
import { PromptBuilderService } from '../../src/modules/story-engine/services/prompt-builder.service';
import { ModerationService } from '../../src/modules/story-engine/services/moderation.service';
import { StoryLLMService } from '../../src/modules/story-engine/services/story-llm.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('StoryEngineService', () => {
  let service: StoryEngineService;

  const mockPrisma = {
    story: {
      create: jest.fn(),
      update: jest.fn(),
    },
    storySession: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockRedisStore = {
    saveSession: jest.fn(),
    getSession: jest.fn(),
    deleteSession: jest.fn(),
    saveNode: jest.fn(),
    getNode: jest.fn(),
    getAllNodes: jest.fn(),
  };

  const mockLLM = {
    generate: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const vals: Record<string, unknown> = {
        'storyEngine.maxTurns': 20,
        'storyEngine.windDownTurn': 15,
        'storyEngine.maxContextChars': 8000,
      };
      return vals[key] ?? null;
    }),
  };

  // Use real prompt builder and moderation for integration-level tests
  const promptBuilder = new PromptBuilderService();
  const moderation = new ModerationService();

  const mockLLMResponse = {
    content: JSON.stringify({
      text: 'Once upon a time in a village near the Ganges...',
      choices: [
        { choiceId: 'c1', label: 'Follow the river', icon: '🌊' },
        { choiceId: 'c2', label: 'Climb the hill', icon: '⛰️' },
      ],
      animationCues: [
        { timestampMs: 0, durationMs: 2000, type: 'expression', value: 'wonder', intensity: 0.8 },
      ],
      subtitles: [
        { startMs: 0, endMs: 3000, text: 'Once upon a time in a village near the Ganges...' },
      ],
      isEnding: false,
    }),
    model: 'mock-v1',
    tokensUsed: 120,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisSessionStore, useValue: mockRedisStore },
        { provide: PromptBuilderService, useValue: promptBuilder },
        { provide: ModerationService, useValue: moderation },
        { provide: StoryLLMService, useValue: mockLLM },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<StoryEngineService>(StoryEngineService);
    jest.clearAllMocks();
    mockLLM.generate.mockResolvedValue(mockLLMResponse);
  });

  describe('startStory', () => {
    it('should create a story and return the first node', async () => {
      mockPrisma.story.create.mockResolvedValue({ id: 'story-1' });
      mockPrisma.storySession.create.mockResolvedValue({});
      mockRedisStore.saveSession.mockResolvedValue(undefined);
      mockRedisStore.saveNode.mockResolvedValue(undefined);

      const result = await service.startStory('user-1', {
        mode: 'mythology',
        tone: 'calm',
        language: 'en',
        prompt: 'A tale of Ganesha',
      });

      expect(result.sessionId).toBeDefined();
      expect(result.node).toBeDefined();
      expect(result.node.text).toContain('village');
      expect(result.node.choices).toHaveLength(2);
      expect(result.node.animationCues).toHaveLength(1);
      expect(result.turnCount).toBe(1);
      expect(result.isEnding).toBe(false);

      expect(mockPrisma.story.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          language: 'en',
          status: 'GENERATING',
        }),
      });
      expect(mockRedisStore.saveSession).toHaveBeenCalled();
      expect(mockRedisStore.saveNode).toHaveBeenCalled();
    });

    it('should reject blocked user prompts', async () => {
      await expect(
        service.startStory('user-1', {
          mode: 'bedtime',
          tone: 'calm',
          language: 'en',
          prompt: 'Tell me about murder and killing',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.story.create).not.toHaveBeenCalled();
    });

    it('should use default prompt when none provided', async () => {
      mockPrisma.story.create.mockResolvedValue({ id: 'story-1' });
      mockPrisma.storySession.create.mockResolvedValue({});

      const result = await service.startStory('user-1', {
        mode: 'bedtime',
        tone: 'calm',
        language: 'en',
      });

      expect(result.node).toBeDefined();
    });
  });

  describe('continueStory', () => {
    const mockSession = {
      sessionId: 'sess-1',
      userId: 'user-1',
      storyId: 'story-1',
      mode: 'mythology' as const,
      tone: 'calm' as const,
      language: 'en',
      currentNodeId: 'node-1',
      path: ['node-1'],
      context: 'Previous text',
      turnCount: 1,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    const mockCurrentNode = {
      nodeId: 'node-1',
      parentNodeId: null,
      text: 'Previous text',
      choices: [
        { choiceId: 'c1', label: 'Follow the river' },
        { choiceId: 'c2', label: 'Climb the hill' },
      ],
      animationCues: [],
      subtitles: [],
      isEnding: false,
      meta: { moderationVerdict: 'pass' as const },
    };

    it('should continue story with valid choice', async () => {
      mockRedisStore.getSession.mockResolvedValue(mockSession);
      mockRedisStore.getNode.mockResolvedValue(mockCurrentNode);
      mockPrisma.storySession.updateMany.mockResolvedValue({});

      const result = await service.continueStory('user-1', {
        sessionId: 'sess-1',
        choiceId: 'c1',
      });

      expect(result.turnCount).toBe(2);
      expect(result.node).toBeDefined();
      expect(mockRedisStore.saveSession).toHaveBeenCalled();
      expect(mockRedisStore.saveNode).toHaveBeenCalled();
    });

    it('should throw NotFoundException for expired session', async () => {
      mockRedisStore.getSession.mockResolvedValue(null);

      await expect(
        service.continueStory('user-1', { sessionId: 'expired', choiceId: 'c1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for wrong user', async () => {
      mockRedisStore.getSession.mockResolvedValue({
        ...mockSession,
        userId: 'other-user',
      });

      await expect(
        service.continueStory('user-1', { sessionId: 'sess-1', choiceId: 'c1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid choice', async () => {
      mockRedisStore.getSession.mockResolvedValue(mockSession);
      mockRedisStore.getNode.mockResolvedValue(mockCurrentNode);

      await expect(
        service.continueStory('user-1', { sessionId: 'sess-1', choiceId: 'invalid' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should force ending at max turns', async () => {
      const nearEndSession = { ...mockSession, turnCount: 19 };
      mockRedisStore.getSession.mockResolvedValue(nearEndSession);
      mockRedisStore.getNode.mockResolvedValue(mockCurrentNode);
      mockPrisma.storySession.updateMany.mockResolvedValue({});
      mockPrisma.story.update.mockResolvedValue({});
      mockRedisStore.getAllNodes.mockResolvedValue([]);
      mockRedisStore.deleteSession.mockResolvedValue(undefined);

      // Mock LLM returning non-ending response -- engine should force it
      mockLLM.generate.mockResolvedValue({
        content: JSON.stringify({
          text: 'The journey continues...',
          choices: [{ choiceId: 'cx', label: 'More' }],
          animationCues: [],
          subtitles: [],
          isEnding: false,
        }),
        model: 'mock-v1',
        tokensUsed: 50,
      });

      const result = await service.continueStory('user-1', {
        sessionId: 'sess-1',
        choiceId: 'c1',
      });

      expect(result.isEnding).toBe(true);
      expect(result.node.choices).toEqual([]);
    });
  });

  describe('endSession', () => {
    it('should finalize session on early end', async () => {
      mockRedisStore.getSession.mockResolvedValue({
        sessionId: 'sess-1',
        userId: 'user-1',
        storyId: 'story-1',
        mode: 'bedtime',
        tone: 'calm',
        language: 'en',
        currentNodeId: 'n1',
        path: ['n1'],
        context: 'text',
        turnCount: 3,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
      mockRedisStore.getAllNodes.mockResolvedValue([
        { nodeId: 'n1', text: 'Hello world' },
      ]);
      mockPrisma.storySession.updateMany.mockResolvedValue({});
      mockPrisma.story.update.mockResolvedValue({});
      mockRedisStore.deleteSession.mockResolvedValue(undefined);

      const result = await service.endSession('user-1', 'sess-1');
      expect(result.message).toBe('Story session ended');
    });

    it('should throw for wrong user', async () => {
      mockRedisStore.getSession.mockResolvedValue({
        sessionId: 'sess-1',
        userId: 'other-user',
      });

      await expect(
        service.endSession('user-1', 'sess-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listSessions', () => {
    it('should return paginated sessions', async () => {
      mockPrisma.storySession.findMany.mockResolvedValue([
        { id: 's1', sessionId: 'sess-1', mode: 'MYTHOLOGY', totalTurns: 5 },
      ]);
      mockPrisma.storySession.count.mockResolvedValue(1);

      const result = await service.listSessions('user-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
