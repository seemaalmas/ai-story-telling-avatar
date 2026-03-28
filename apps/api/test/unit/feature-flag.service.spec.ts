import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FeatureFlagService } from '../../src/modules/admin/services/feature-flag.service';
import { AdminAuditService } from '../../src/modules/admin/services/admin-audit.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  const mockPrisma = {
    featureFlag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAudit = { log: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AdminAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<FeatureFlagService>(FeatureFlagService);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all flags ordered by key', async () => {
      const flags = [{ key: 'a_flag' }, { key: 'b_flag' }];
      mockPrisma.featureFlag.findMany.mockResolvedValue(flags);
      expect(await service.getAll()).toEqual(flags);
    });
  });

  describe('get', () => {
    it('should return a flag by key', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({ key: 'test', enabled: true });
      expect(await service.get('test')).toEqual({ key: 'test', enabled: true });
    });

    it('should throw NotFoundException for missing flag', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue(null);
      await expect(service.get('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isEnabled', () => {
    it('should return true for enabled flag', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({ enabled: true });
      expect(await service.isEnabled('test')).toBe(true);
    });

    it('should return false for missing flag', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue(null);
      expect(await service.isEnabled('missing')).toBe(false);
    });
  });

  describe('upsert', () => {
    it('should create/update a flag and audit', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue(null);
      mockPrisma.featureFlag.upsert.mockResolvedValue({ key: 'new_flag', enabled: true });

      const result = await service.upsert('admin-1', 'new_flag', { enabled: true, description: 'test' });

      expect(result.key).toBe('new_flag');
      expect(mockAudit.log).toHaveBeenCalledWith(
        'admin-1', 'feature_flag_enabled', 'feature_flag', 'new_flag',
        null, expect.any(Object), undefined,
      );
    });

    it('should log kill_switch_activated for kill switch toggles', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({ key: 'kill', enabled: true });
      mockPrisma.featureFlag.upsert.mockResolvedValue({ key: 'kill', enabled: false, isKillSwitch: true });

      await service.upsert('admin-1', 'kill', { enabled: false, isKillSwitch: true });

      expect(mockAudit.log).toHaveBeenCalledWith(
        'admin-1', 'kill_switch_deactivated', 'feature_flag', 'kill',
        expect.any(Object), expect.any(Object), undefined,
      );
    });
  });

  describe('delete', () => {
    it('should delete a flag and audit', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({ key: 'del_me', enabled: false });
      mockPrisma.featureFlag.delete.mockResolvedValue({});

      const result = await service.delete('admin-1', 'del_me');
      expect(result.message).toContain('deleted');
      expect(mockAudit.log).toHaveBeenCalledWith(
        'admin-1', 'feature_flag_deleted', 'feature_flag', 'del_me',
        expect.any(Object), null, undefined,
      );
    });
  });
});
