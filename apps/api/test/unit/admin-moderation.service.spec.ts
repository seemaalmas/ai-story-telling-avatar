import { Test, TestingModule } from '@nestjs/testing';
import { AdminModerationService } from '../../src/modules/admin/services/admin-moderation.service';
import { AdminAuditService } from '../../src/modules/admin/services/admin-audit.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AdminModerationService', () => {
  let service: AdminModerationService;

  const mockPrisma = {
    abuseReport: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    avatar: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    story: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    storySession: { count: jest.fn() },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    featureFlag: { findMany: jest.fn(), upsert: jest.fn() },
  };

  const mockAudit = { log: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminModerationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AdminModerationService>(AdminModerationService);
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return aggregated stats', async () => {
      mockPrisma.user.count.mockResolvedValueOnce(100).mockResolvedValueOnce(42);
      mockPrisma.story.count.mockResolvedValue(500);
      mockPrisma.abuseReport.count.mockResolvedValue(3);

      const stats = await service.getDashboardStats();
      expect(stats.totalUsers).toBe(100);
      expect(stats.activeToday).toBe(42);
      expect(stats.totalStories).toBe(500);
      expect(stats.openReports).toBe(3);
    });
  });

  describe('resolveAbuseReport', () => {
    it('should resolve a report and audit', async () => {
      mockPrisma.abuseReport.findUnique.mockResolvedValue({ id: 'r1', status: 'OPEN' });
      mockPrisma.abuseReport.update.mockResolvedValue({ id: 'r1', status: 'DISMISSED' });

      const result = await service.resolveAbuseReport('admin-1', 'r1', 'DISMISSED', 'Not a real issue');

      expect(result.status).toBe('DISMISSED');
      expect(mockAudit.log).toHaveBeenCalledWith(
        'admin-1', 'abuse_report_resolved', 'abuse_report', 'r1',
        expect.any(Object), expect.any(Object), undefined,
      );
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar and audit', async () => {
      mockPrisma.avatar.findUnique.mockResolvedValue({ id: 'a1', name: 'Old', isPublic: false });
      mockPrisma.avatar.update.mockResolvedValue({ id: 'a1', name: 'New', isPublic: true });

      const result = await service.updateAvatar('admin-1', 'a1', { name: 'New', isPublic: true });

      expect(result.name).toBe('New');
      expect(mockAudit.log).toHaveBeenCalled();
    });
  });

  describe('toggleLanguage', () => {
    it('should toggle a language via feature flag', async () => {
      mockPrisma.featureFlag.upsert.mockResolvedValue({ key: 'lang_hi_enabled', enabled: false });

      await service.toggleLanguage('admin-1', 'hi', false);

      expect(mockPrisma.featureFlag.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { key: 'lang_hi_enabled' },
      }));
      expect(mockAudit.log).toHaveBeenCalledWith(
        'admin-1', 'language_disabled', 'language', 'hi', null, expect.any(Object), undefined,
      );
    });
  });

  describe('updateUserRole', () => {
    it('should change role and audit', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'USER' });
      mockPrisma.user.update.mockResolvedValue({ id: 'u1', role: 'ADMIN' });

      const result = await service.updateUserRole('admin-1', 'u1', 'ADMIN');

      expect(result.role).toBe('ADMIN');
      expect(mockAudit.log).toHaveBeenCalledWith(
        'admin-1', 'user_role_changed', 'user', 'u1',
        expect.any(Object), expect.any(Object), undefined,
      );
    });
  });

  describe('banUser', () => {
    it('should deactivate user and audit', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: 'u1', isActive: false });

      const result = await service.banUser('admin-1', 'u1');

      expect(result.isActive).toBe(false);
      expect(mockAudit.log).toHaveBeenCalledWith(
        'admin-1', 'user_banned', 'user', 'u1', null, expect.any(Object), undefined,
      );
    });
  });

  describe('getStoryStats', () => {
    it('should return story counts', async () => {
      mockPrisma.story.count.mockResolvedValue(100);
      mockPrisma.storySession.count.mockResolvedValue(250);
      mockPrisma.story.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: 80 },
        { status: 'DRAFT', _count: 20 },
      ]);

      const stats = await service.getStoryStats();

      expect(stats.totalStories).toBe(100);
      expect(stats.totalSessions).toBe(250);
      expect(stats.byStatus.COMPLETED).toBe(80);
    });
  });
});
