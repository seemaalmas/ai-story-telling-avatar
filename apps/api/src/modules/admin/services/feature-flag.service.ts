import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async getAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async get(key: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) throw new NotFoundException(`Feature flag "${key}" not found`);
    return flag;
  }

  async isEnabled(key: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    return flag?.enabled ?? false;
  }

  async upsert(
    adminUserId: string,
    key: string,
    data: { enabled: boolean; description?: string; rules?: object; isKillSwitch?: boolean },
    ipAddress?: string,
  ) {
    const before = await this.prisma.featureFlag.findUnique({ where: { key } });

    const flag = await this.prisma.featureFlag.upsert({
      where: { key },
      create: {
        key,
        enabled: data.enabled,
        description: data.description,
        rules: data.rules ?? undefined,
        isKillSwitch: data.isKillSwitch ?? false,
        updatedBy: adminUserId,
      },
      update: {
        enabled: data.enabled,
        description: data.description ?? undefined,
        rules: data.rules ?? undefined,
        isKillSwitch: data.isKillSwitch,
        updatedBy: adminUserId,
      },
    });

    const action = data.isKillSwitch
      ? data.enabled ? 'kill_switch_activated' : 'kill_switch_deactivated'
      : data.enabled ? 'feature_flag_enabled' : 'feature_flag_disabled';

    await this.audit.log(adminUserId, action, 'feature_flag', key, before, flag, ipAddress);

    if (data.isKillSwitch) {
      this.logger.warn(`KILL SWITCH ${data.enabled ? 'ACTIVATED' : 'DEACTIVATED'}: ${key} by ${adminUserId}`);
    }

    return flag;
  }

  async delete(adminUserId: string, key: string, ipAddress?: string) {
    const flag = await this.get(key);
    await this.prisma.featureFlag.delete({ where: { key } });
    await this.audit.log(adminUserId, 'feature_flag_deleted', 'feature_flag', key, flag, null, ipAddress);
    return { message: `Flag "${key}" deleted` };
  }

  /**
   * Seed default flags. Called at startup or via admin endpoint.
   */
  async seedDefaults() {
    const defaults = [
      { key: 'story_engine_enabled', enabled: true, description: 'Master switch for the story engine', isKillSwitch: true },
      { key: 'voice_pipeline_enabled', enabled: true, description: 'Master switch for voice synthesis', isKillSwitch: true },
      { key: 'self_voice_enrollment', enabled: false, description: 'Allow users to enroll their own voice', isKillSwitch: false },
      { key: 'family_plan_available', enabled: false, description: 'Show family plan in paywall', isKillSwitch: false },
      { key: 'premium_templates', enabled: true, description: 'Premium story templates visible', isKillSwitch: false },
      { key: 'moderation_strict', enabled: true, description: 'Strict content moderation mode', isKillSwitch: false },
    ];

    for (const d of defaults) {
      await this.prisma.featureFlag.upsert({
        where: { key: d.key },
        create: { ...d, updatedBy: 'system' },
        update: {},
      });
    }

    return { seeded: defaults.length };
  }
}
