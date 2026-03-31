import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceOS?: string;
  deviceOSVersion?: string;
  appVersion?: string;
  ipAddress?: string;
}

@Injectable()
export class DeviceSessionService {
  private readonly logger = new Logger(DeviceSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async upsertSession(userId: string, device: DeviceInfo): Promise<string> {
    const maxSessions = this.config.get<number>('auth.maxDeviceSessions') ?? 5;

    // Upsert device session
    const session = await this.prisma.deviceSession.upsert({
      where: {
        userId_deviceId: { userId, deviceId: device.deviceId },
      },
      create: {
        userId,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceOS: device.deviceOS,
        deviceOSVersion: device.deviceOSVersion,
        appVersion: device.appVersion,
        ipAddress: device.ipAddress,
        isActive: true,
      },
      update: {
        deviceName: device.deviceName,
        deviceOS: device.deviceOS,
        deviceOSVersion: device.deviceOSVersion,
        appVersion: device.appVersion,
        ipAddress: device.ipAddress,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    // Enforce max device sessions: deactivate oldest if over limit
    const activeSessions = await this.prisma.deviceSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
    });

    if (activeSessions.length > maxSessions) {
      const sessionsToDeactivate = activeSessions.slice(maxSessions);
      const idsToDeactivate = sessionsToDeactivate.map((s: { id: string }) => s.id);

      await this.prisma.deviceSession.updateMany({
        where: { id: { in: idsToDeactivate } },
        data: { isActive: false },
      });

      // Revoke refresh tokens for deactivated sessions
      await this.prisma.refreshToken.deleteMany({
        where: { deviceSessionId: { in: idsToDeactivate } },
      });

      this.logger.log(
        `Deactivated ${idsToDeactivate.length} old sessions for user ${userId}`,
      );
    }

    return session.id;
  }

  async getActiveSessions(userId: string) {
    return this.prisma.deviceSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        deviceOS: true,
        deviceOSVersion: true,
        appVersion: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.prisma.deviceSession.updateMany({
      where: { id: sessionId, userId },
      data: { isActive: false },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { deviceSessionId: sessionId },
    });
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const where: { userId: string; isActive: boolean; id?: { not: string } } = {
      userId,
      isActive: true,
    };

    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }

    const sessions: Array<{ id: string }> = await this.prisma.deviceSession.findMany({ where, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);

    await this.prisma.deviceSession.updateMany({
      where: { id: { in: sessionIds } },
      data: { isActive: false },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { deviceSessionId: { in: sessionIds } },
    });
  }
}
