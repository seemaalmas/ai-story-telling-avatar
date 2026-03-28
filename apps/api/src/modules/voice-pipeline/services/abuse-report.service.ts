import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Hook functions that are called at key points in the abuse report lifecycle.
 * Register hooks to integrate with external systems (Slack alerts, moderation
 * queues, automatic voice disabling, etc.).
 */
export interface AbuseReportHook {
  /** Called when a new report is filed */
  onReportCreated?(report: AbuseReportData): void | Promise<void>;
  /** Called when a report is resolved */
  onReportResolved?(report: AbuseReportData, resolution: string): void | Promise<void>;
  /** Called when a voice enrollment is auto-suspended due to reports */
  onVoiceSuspended?(enrollmentId: string, reportIds: string[]): void | Promise<void>;
}

interface AbuseReportData {
  id: string;
  reporterUserId: string;
  targetType: string;
  targetId: string;
  category: string;
  description: string;
  status: string;
}

/** Threshold: auto-suspend voice enrollment after this many open reports */
const AUTO_SUSPEND_THRESHOLD = 3;

@Injectable()
export class AbuseReportService {
  private readonly logger = new Logger(AbuseReportService.name);
  private hooks: AbuseReportHook[] = [];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a hook for abuse report lifecycle events.
   * Call this from your module's onModuleInit to wire up integrations.
   */
  registerHook(hook: AbuseReportHook): void {
    this.hooks.push(hook);
    this.logger.log(`Abuse report hook registered (total: ${this.hooks.length})`);
  }

  /**
   * File a new abuse report.
   */
  async createReport(input: {
    reporterUserId: string;
    targetType: string;
    targetId: string;
    category: string;
    description: string;
  }) {
    const report = await this.prisma.abuseReport.create({
      data: {
        reporterUserId: input.reporterUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        category: input.category,
        description: input.description,
        status: 'OPEN',
      },
    });

    this.logger.log(
      `Abuse report created: ${report.id} (${input.category} on ${input.targetType}:${input.targetId})`,
    );

    // Fire hooks
    for (const hook of this.hooks) {
      try {
        await hook.onReportCreated?.(report);
      } catch (err) {
        this.logger.error(`Hook onReportCreated failed: ${err}`);
      }
    }

    // Auto-suspend check for voice enrollments
    if (input.targetType === 'voice_enrollment') {
      await this.checkAutoSuspend(input.targetId);
    }

    return {
      id: report.id,
      status: report.status.toLowerCase(),
      createdAt: report.createdAt.toISOString(),
    };
  }

  /**
   * Get reports filed by a user.
   */
  async getMyReports(userId: string) {
    const reports = await this.prisma.abuseReport.findMany({
      where: { reporterUserId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        category: true,
        status: true,
        createdAt: true,
      },
    });
    return reports.map((r) => ({
      ...r,
      status: r.status.toLowerCase(),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Resolve a report (admin only in production).
   */
  async resolveReport(
    reportId: string,
    resolution: 'RESOLVED_ACTION_TAKEN' | 'RESOLVED_NO_ACTION' | 'DISMISSED',
    notes?: string,
  ) {
    const report = await this.prisma.abuseReport.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');

    const updated = await this.prisma.abuseReport.update({
      where: { id: reportId },
      data: {
        status: resolution,
        resolutionNotes: notes,
        resolvedAt: new Date(),
      },
    });

    for (const hook of this.hooks) {
      try {
        await hook.onReportResolved?.(updated, resolution);
      } catch (err) {
        this.logger.error(`Hook onReportResolved failed: ${err}`);
      }
    }

    return { id: updated.id, status: updated.status.toLowerCase() };
  }

  // ─── Auto-suspend Logic ─────────────────────────────────

  private async checkAutoSuspend(enrollmentId: string): Promise<void> {
    const openCount = await this.prisma.abuseReport.count({
      where: {
        targetType: 'voice_enrollment',
        targetId: enrollmentId,
        status: 'OPEN',
      },
    });

    if (openCount >= AUTO_SUSPEND_THRESHOLD) {
      this.logger.warn(
        `Auto-suspending voice enrollment ${enrollmentId} (${openCount} open reports)`,
      );

      await this.prisma.voiceEnrollment.updateMany({
        where: { id: enrollmentId, status: { not: 'REVOKED' } },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });

      const reportIds = (
        await this.prisma.abuseReport.findMany({
          where: {
            targetType: 'voice_enrollment',
            targetId: enrollmentId,
            status: 'OPEN',
          },
          select: { id: true },
        })
      ).map((r) => r.id);

      for (const hook of this.hooks) {
        try {
          await hook.onVoiceSuspended?.(enrollmentId, reportIds);
        } catch (err) {
          this.logger.error(`Hook onVoiceSuspended failed: ${err}`);
        }
      }
    }
  }
}
