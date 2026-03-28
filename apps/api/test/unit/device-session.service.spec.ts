import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DeviceSessionService } from '../../src/modules/auth/services/device-session.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('DeviceSessionService', () => {
  let service: DeviceSessionService;

  const mockPrisma = {
    deviceSession: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      deleteMany: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue(5),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceSessionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<DeviceSessionService>(DeviceSessionService);
    jest.clearAllMocks();
  });

  describe('upsertSession', () => {
    it('should create/update a device session', async () => {
      mockPrisma.deviceSession.upsert.mockResolvedValue({ id: 'session-1' });
      mockPrisma.deviceSession.findMany.mockResolvedValue([{ id: 'session-1' }]);

      const result = await service.upsertSession('user-1', {
        deviceId: 'dev-1',
        deviceName: 'iPhone 15',
        deviceOS: 'iOS',
      });

      expect(result).toBe('session-1');
      expect(mockPrisma.deviceSession.upsert).toHaveBeenCalledWith({
        where: { userId_deviceId: { userId: 'user-1', deviceId: 'dev-1' } },
        create: expect.objectContaining({ userId: 'user-1', deviceId: 'dev-1' }),
        update: expect.objectContaining({ deviceName: 'iPhone 15' }),
      });
    });

    it('should deactivate oldest sessions when over limit', async () => {
      mockPrisma.deviceSession.upsert.mockResolvedValue({ id: 'session-6' });
      mockPrisma.deviceSession.findMany.mockResolvedValue([
        { id: 'session-6' },
        { id: 'session-5' },
        { id: 'session-4' },
        { id: 'session-3' },
        { id: 'session-2' },
        { id: 'session-1' }, // oldest, should be deactivated
      ]);
      mockPrisma.deviceSession.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.upsertSession('user-1', { deviceId: 'dev-6' });

      expect(mockPrisma.deviceSession.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['session-1'] } },
        data: { isActive: false },
      });
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { deviceSessionId: { in: ['session-1'] } },
      });
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions', async () => {
      const sessions = [
        { id: 's1', deviceId: 'd1', deviceName: 'Phone', lastActiveAt: new Date() },
      ];
      mockPrisma.deviceSession.findMany.mockResolvedValue(sessions);

      const result = await service.getActiveSessions('user-1');

      expect(result).toEqual(sessions);
      expect(mockPrisma.deviceSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true },
        orderBy: { lastActiveAt: 'desc' },
        select: expect.any(Object),
      });
    });
  });

  describe('revokeSession', () => {
    it('should deactivate session and delete tokens', async () => {
      mockPrisma.deviceSession.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.revokeSession('user-1', 'session-1');

      expect(mockPrisma.deviceSession.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-1', userId: 'user-1' },
        data: { isActive: false },
      });
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { deviceSessionId: 'session-1' },
      });
    });
  });

  describe('revokeAllSessions', () => {
    it('should deactivate all sessions', async () => {
      mockPrisma.deviceSession.findMany.mockResolvedValue([
        { id: 's1' },
        { id: 's2' },
      ]);
      mockPrisma.deviceSession.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await service.revokeAllSessions('user-1');

      expect(mockPrisma.deviceSession.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['s1', 's2'] } },
        data: { isActive: false },
      });
    });

    it('should exclude a specific session when requested', async () => {
      mockPrisma.deviceSession.findMany.mockResolvedValue([{ id: 's2' }]);
      mockPrisma.deviceSession.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.revokeAllSessions('user-1', 's1');

      expect(mockPrisma.deviceSession.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ id: { not: 's1' } }),
        select: { id: true },
      });
    });
  });
});
