import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  // ─── Abuse Reports Queue ─────────────────────────────────

  async getAbuseReports(page = 1, limit = 20, status?: string) {
    const where = status
      ? { status: status.toUpperCase() as 'OPEN' | 'INVESTIGATING' | 'RESOLVED_ACTION_TAKEN' | 'RESOLVED_NO_ACTION' | 'DISMISSED' }
      : {};

    const [reports, total] = await Promise.all([
      this.prisma.abuseReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { reporter: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.abuseReport.count({ where }),
    ]);

    return { data: reports, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async resolveAbuseReport(
    adminUserId: string,
    reportId: string,
    resolution: string,
    notes?: string,
    ipAddress?: string,
  ) {
    const before = await this.prisma.abuseReport.findUnique({ where: { id: reportId } });

    const report = await this.prisma.abuseReport.update({
      where: { id: reportId },
      data: {
        status: resolution.toUpperCase() as 'RESOLVED_ACTION_TAKEN' | 'RESOLVED_NO_ACTION' | 'DISMISSED',
        resolutionNotes: notes,
        resolvedAt: new Date(),
      },
    });

    await this.audit.log(adminUserId, 'abuse_report_resolved', 'abuse_report', reportId, before, report, ipAddress);

    return report;
  }

  // ─── Avatar Catalog ──────────────────────────────────────

  async getAvatars(page = 1, limit = 20) {
    const [avatars, total] = await Promise.all([
      this.prisma.avatar.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.avatar.count(),
    ]);
    return { data: avatars, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateAvatar(
    adminUserId: string,
    avatarId: string,
    data: { name?: string; description?: string; isPublic?: boolean },
    ipAddress?: string,
  ) {
    const before = await this.prisma.avatar.findUnique({ where: { id: avatarId } });
    const avatar = await this.prisma.avatar.update({ where: { id: avatarId }, data });
    await this.audit.log(adminUserId, 'avatar_updated', 'avatar', avatarId, before, avatar, ipAddress);
    return avatar;
  }

  // ─── Story Packs / Seeds Management ──────────────────────
  // Story seeds are code-defined (apps/api/src/modules/story-engine/seeds/index.ts).
  // This endpoint provides visibility. To add/edit seeds in production,
  // move to a DB-backed model and use these CRUD operations.

  async getStoryStats() {
    const [totalStories, totalSessions, statusCounts] = await Promise.all([
      this.prisma.story.count(),
      this.prisma.storySession.count(),
      this.prisma.story.groupBy({ by: ['status'], _count: true }),
    ]);

    return {
      totalStories,
      totalSessions,
      byStatus: Object.fromEntries(statusCounts.map((s: { status: string; _count: number }) => [s.status, s._count])),
    };
  }

  // ─── Language Pack Toggles ───────────────────────────────
  // Languages are toggled via feature flags with key pattern: lang_<code>_enabled

  async getLanguageStates() {
    const flags = await this.prisma.featureFlag.findMany({
      where: { key: { startsWith: 'lang_' } },
    });

    const LANGS = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'kn', 'gu', 'ml', 'pa'];
    return LANGS.map((code) => ({
      code,
      enabled: flags.find((f: { key: string; enabled: boolean }) => f.key === `lang_${code}_enabled`)?.enabled ?? true,
    }));
  }

  async toggleLanguage(
    adminUserId: string,
    languageCode: string,
    enabled: boolean,
    ipAddress?: string,
  ) {
    const key = `lang_${languageCode}_enabled`;
    const flag = await this.prisma.featureFlag.upsert({
      where: { key },
      create: { key, enabled, description: `Language: ${languageCode}`, updatedBy: adminUserId },
      update: { enabled, updatedBy: adminUserId },
    });
    await this.audit.log(adminUserId, enabled ? 'language_enabled' : 'language_disabled', 'language', languageCode, null, flag, ipAddress);
    return flag;
  }

  // ─── Dashboard Stats ─────────────────────────────────────

  async getDashboardStats() {
    const [totalUsers, activeToday, totalStories, openReports] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: new Date(Date.now() - 86400000) } },
      }),
      this.prisma.story.count(),
      this.prisma.abuseReport.count({ where: { status: 'OPEN' } }),
    ]);

    return { totalUsers, activeToday, totalStories, openReports };
  }

  // ─── User Management ─────────────────────────────────────

  async getUsers(page = 1, limit = 20, search?: string) {
    const where = search
      ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, email: true, name: true, role: true, isActive: true,
          authProvider: true, preferredLanguage: true, emailVerified: true,
          lastLoginAt: true, createdAt: true,
          _count: { select: { stories: true, storySessions: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateUserRole(
    adminUserId: string,
    userId: string,
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN',
    ipAddress?: string,
  ) {
    const before = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    const user = await this.prisma.user.update({ where: { id: userId }, data: { role } });
    await this.audit.log(adminUserId, 'user_role_changed', 'user', userId, before, { id: userId, role }, ipAddress);
    return { id: user.id, role: user.role };
  }

  async banUser(adminUserId: string, userId: string, ipAddress?: string) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    await this.audit.log(adminUserId, 'user_banned', 'user', userId, null, { id: userId }, ipAddress);
    return { id: user.id, isActive: user.isActive };
  }
}
