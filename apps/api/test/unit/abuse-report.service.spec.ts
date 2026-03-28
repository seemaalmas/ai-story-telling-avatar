import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  AbuseReportService,
  AbuseReportHook,
} from '../../src/modules/voice-pipeline/services/abuse-report.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AbuseReportService', () => {
  let service: AbuseReportService;

  const mockPrisma = {
    abuseReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    voiceEnrollment: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbuseReportService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AbuseReportService>(AbuseReportService);
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('should create an abuse report', async () => {
      mockPrisma.abuseReport.create.mockResolvedValue({
        id: 'report-1',
        status: 'OPEN',
        createdAt: new Date(),
      });
      mockPrisma.abuseReport.count.mockResolvedValue(0);

      const result = await service.createReport({
        reporterUserId: 'user-1',
        targetType: 'voice_output',
        targetId: 'output-1',
        category: 'impersonation',
        description: 'This sounds like a public figure',
      });

      expect(result.id).toBe('report-1');
      expect(result.status).toBe('open');
    });

    it('should fire onReportCreated hook', async () => {
      const hook: AbuseReportHook = { onReportCreated: jest.fn() };
      service.registerHook(hook);

      mockPrisma.abuseReport.create.mockResolvedValue({
        id: 'report-1',
        reporterUserId: 'user-1',
        targetType: 'voice_output',
        targetId: 'output-1',
        category: 'impersonation',
        description: 'desc',
        status: 'OPEN',
        createdAt: new Date(),
      });
      mockPrisma.abuseReport.count.mockResolvedValue(0);

      await service.createReport({
        reporterUserId: 'user-1',
        targetType: 'voice_output',
        targetId: 'output-1',
        category: 'impersonation',
        description: 'desc',
      });

      expect(hook.onReportCreated).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'report-1' }),
      );
    });

    it('should auto-suspend voice enrollment after 3 reports', async () => {
      mockPrisma.abuseReport.create.mockResolvedValue({
        id: 'report-3',
        status: 'OPEN',
        createdAt: new Date(),
      });
      // 3 open reports — should trigger auto-suspend
      mockPrisma.abuseReport.count.mockResolvedValue(3);
      mockPrisma.voiceEnrollment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.abuseReport.findMany.mockResolvedValue([
        { id: 'r1' },
        { id: 'r2' },
        { id: 'r3' },
      ]);

      await service.createReport({
        reporterUserId: 'user-2',
        targetType: 'voice_enrollment',
        targetId: 'enroll-1',
        category: 'deepfake',
        description: 'This is a deepfake voice',
      });

      expect(mockPrisma.voiceEnrollment.updateMany).toHaveBeenCalledWith({
        where: { id: 'enroll-1', status: { not: 'REVOKED' } },
        data: expect.objectContaining({ status: 'REVOKED' }),
      });
    });

    it('should fire onVoiceSuspended hook on auto-suspend', async () => {
      const hook: AbuseReportHook = { onVoiceSuspended: jest.fn() };
      service.registerHook(hook);

      mockPrisma.abuseReport.create.mockResolvedValue({
        id: 'report-3',
        status: 'OPEN',
        createdAt: new Date(),
      });
      mockPrisma.abuseReport.count.mockResolvedValue(3);
      mockPrisma.voiceEnrollment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.abuseReport.findMany.mockResolvedValue([
        { id: 'r1' },
        { id: 'r2' },
        { id: 'r3' },
      ]);

      await service.createReport({
        reporterUserId: 'user-2',
        targetType: 'voice_enrollment',
        targetId: 'enroll-1',
        category: 'impersonation',
        description: 'Fake voice of a celebrity',
      });

      expect(hook.onVoiceSuspended).toHaveBeenCalledWith(
        'enroll-1',
        ['r1', 'r2', 'r3'],
      );
    });
  });

  describe('resolveReport', () => {
    it('should resolve a report', async () => {
      mockPrisma.abuseReport.findUnique.mockResolvedValue({
        id: 'report-1',
        status: 'OPEN',
      });
      mockPrisma.abuseReport.update.mockResolvedValue({
        id: 'report-1',
        status: 'RESOLVED_ACTION_TAKEN',
      });

      const result = await service.resolveReport(
        'report-1',
        'RESOLVED_ACTION_TAKEN',
        'Voice enrollment revoked',
      );

      expect(result.status).toBe('resolved_action_taken');
    });

    it('should fire onReportResolved hook', async () => {
      const hook: AbuseReportHook = { onReportResolved: jest.fn() };
      service.registerHook(hook);

      mockPrisma.abuseReport.findUnique.mockResolvedValue({ id: 'report-1' });
      mockPrisma.abuseReport.update.mockResolvedValue({
        id: 'report-1',
        status: 'DISMISSED',
      });

      await service.resolveReport('report-1', 'DISMISSED');
      expect(hook.onReportResolved).toHaveBeenCalled();
    });

    it('should throw for nonexistent report', async () => {
      mockPrisma.abuseReport.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveReport('nonexistent', 'DISMISSED'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyReports', () => {
    it('should return user reports', async () => {
      mockPrisma.abuseReport.findMany.mockResolvedValue([
        {
          id: 'r1',
          targetType: 'voice_output',
          targetId: 'o1',
          category: 'impersonation',
          status: 'OPEN',
          createdAt: new Date(),
        },
      ]);

      const reports = await service.getMyReports('user-1');
      expect(reports).toHaveLength(1);
      expect(reports[0].status).toBe('open');
    });
  });

  describe('registerHook', () => {
    it('should allow multiple hooks', () => {
      const hook1: AbuseReportHook = {};
      const hook2: AbuseReportHook = {};

      service.registerHook(hook1);
      service.registerHook(hook2);

      // No error thrown — hooks are accumulated
    });
  });
});
