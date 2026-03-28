import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    adminUserId: string,
    action: string,
    resource: string,
    resourceId?: string,
    before?: unknown,
    after?: unknown,
    ipAddress?: string,
  ) {
    return this.prisma.adminAudit.create({
      data: {
        adminUserId,
        action,
        resource,
        resourceId,
        before: before as object ?? undefined,
        after: after as object ?? undefined,
        ipAddress,
      },
    });
  }

  async getLog(page = 1, limit = 50, filters?: { action?: string; resource?: string; adminUserId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.adminUserId) where.adminUserId = filters.adminUserId;

    const [entries, total] = await Promise.all([
      this.prisma.adminAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adminAudit.count({ where }),
    ]);

    return { data: entries, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
