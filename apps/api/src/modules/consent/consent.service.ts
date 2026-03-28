import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GrantConsentDto, RevokeConsentDto } from './dto';

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserConsents(userId: string) {
    const consents = await this.prisma.consent.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        type: true,
        granted: true,
        version: true,
        grantedAt: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { consents };
  }

  async grantConsent(
    userId: string,
    dto: GrantConsentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const consent = await this.prisma.consent.upsert({
      where: {
        userId_type_version: {
          userId,
          type: dto.type,
          version: dto.version ?? '1.0',
        },
      },
      create: {
        userId,
        type: dto.type,
        granted: true,
        version: dto.version ?? '1.0',
        ipAddress,
        userAgent,
        grantedAt: new Date(),
      },
      update: {
        granted: true,
        ipAddress,
        userAgent,
        grantedAt: new Date(),
        revokedAt: null,
      },
    });

    return consent;
  }

  async grantBulk(
    userId: string,
    consents: GrantConsentDto[],
    ipAddress?: string,
    userAgent?: string,
  ) {
    const results = await this.prisma.$transaction(
      consents.map((dto) =>
        this.prisma.consent.upsert({
          where: {
            userId_type_version: {
              userId,
              type: dto.type,
              version: dto.version ?? '1.0',
            },
          },
          create: {
            userId,
            type: dto.type,
            granted: true,
            version: dto.version ?? '1.0',
            ipAddress,
            userAgent,
            grantedAt: new Date(),
          },
          update: {
            granted: true,
            ipAddress,
            userAgent,
            grantedAt: new Date(),
            revokedAt: null,
          },
        }),
      ),
    );
    return { consents: results };
  }

  async revokeConsent(
    userId: string,
    dto: RevokeConsentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const consent = await this.prisma.consent.updateMany({
      where: {
        userId,
        type: dto.type,
        granted: true,
      },
      data: {
        granted: false,
        revokedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    return { revoked: consent.count > 0 };
  }

  async hasConsent(userId: string, type: string, version = '1.0'): Promise<boolean> {
    const consent = await this.prisma.consent.findUnique({
      where: {
        userId_type_version: { userId, type: type as never, version },
      },
    });
    return consent?.granted ?? false;
  }
}
