import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlanService } from './plan.service';
import { ReceiptValidatorService } from './receipt-validator.service';

import type {
  PlanId,
  StorePlatform,
  Entitlements,
  SubscriptionStatus,
  EntitlementAuditAction,
} from '@katha/shared';

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlanService,
    private readonly receiptValidator: ReceiptValidatorService,
  ) {}

  // ─── Get Entitlements ─────────────────────────────────────

  async getEntitlements(userId: string): Promise<Entitlements> {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      return this.plans.resolveEntitlements('free', 'active');
    }

    return this.plans.resolveEntitlements(
      subscription.planId.toLowerCase() as PlanId,
      subscription.status.toLowerCase(),
      subscription.currentPeriodEnd.toISOString(),
    );
  }

  /**
   * Check if a user has a specific feature.
   */
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const entitlements = await this.getEntitlements(userId);
    return entitlements.features.includes(feature as Entitlements['features'][number]);
  }

  // ─── Purchase Flow ────────────────────────────────────────

  async processPurchase(
    userId: string,
    platform: StorePlatform,
    receipt: string,
    productId: string,
    transactionId?: string,
    ipAddress?: string,
  ) {
    // 1. Validate receipt with the store
    const validation = await this.receiptValidator.validate(platform, receipt, productId);

    await this.audit(userId, 'receipt_validated', {
      planId: productId,
      platform,
      transactionId: validation.transactionId,
      details: {
        valid: validation.valid,
        error: validation.error,
      },
      ipAddress,
    });

    if (!validation.valid) {
      await this.audit(userId, 'receipt_validation_failed', {
        planId: productId,
        platform,
        details: { error: validation.error },
        ipAddress,
      });
      throw new BadRequestException(`Receipt validation failed: ${validation.error}`);
    }

    // 2. Resolve plan from product ID
    const plan = this.plans.getPlanByStoreProductId(productId);
    if (!plan) {
      throw new BadRequestException(`Unknown product ID: ${productId}`);
    }

    const prismaStatus = this.toPrismaStatus('active');
    const prismaPlan = this.toPrismaPlan(plan.id);
    const prismaPlatform = this.toPrismaPlatform(platform);

    const now = new Date();
    const periodEnd = validation.expiresAt
      ? new Date(validation.expiresAt)
      : new Date(now.getTime() + plan.intervalMonths * 30 * 24 * 60 * 60 * 1000);

    // 3. Create or update subscription
    const subscription = await this.prisma.subscription.upsert({
      where: {
        userId_planId_platform: {
          userId,
          planId: prismaPlan,
          platform: prismaPlatform,
        },
      },
      create: {
        userId,
        planId: prismaPlan,
        status: prismaStatus,
        platform: prismaPlatform,
        storeProductId: productId,
        storeTransactionId: validation.transactionId,
        latestReceipt: receipt,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        status: prismaStatus,
        storeTransactionId: validation.transactionId,
        latestReceipt: receipt,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
        autoRenew: true,
      },
    });

    const action: EntitlementAuditAction = validation.isRenewal
      ? 'subscription_renewed'
      : 'subscription_created';

    const entitlements = this.plans.resolveEntitlements(plan.id, 'active', periodEnd.toISOString());

    await this.audit(userId, action, {
      planId: plan.id,
      platform,
      transactionId: validation.transactionId,
      entitlements,
      ipAddress,
    });

    this.logger.log(
      `Subscription ${action}: user=${userId}, plan=${plan.id}, platform=${platform}`,
    );

    return {
      subscription: {
        id: subscription.id,
        planId: plan.id,
        status: 'active',
        platform,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      },
      entitlements,
    };
  }

  // ─── Restore Purchases ────────────────────────────────────

  async restorePurchases(
    userId: string,
    platform: StorePlatform,
    receipts: Array<{ receipt: string; productId: string; transactionId?: string }>,
    ipAddress?: string,
  ) {
    const results: Array<{ productId: string; restored: boolean; error?: string }> = [];

    for (const r of receipts) {
      try {
        await this.processPurchase(userId, platform, r.receipt, r.productId, r.transactionId, ipAddress);
        results.push({ productId: r.productId, restored: true });
      } catch (err) {
        results.push({
          productId: r.productId,
          restored: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    await this.audit(userId, 'restore_completed', {
      platform,
      details: { results },
      ipAddress,
    });

    return { results, entitlements: await this.getEntitlements(userId) };
  }

  // ─── Cancel ───────────────────────────────────────────────

  async cancelSubscription(userId: string, subscriptionId: string, ipAddress?: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        autoRenew: false,
      },
    });

    await this.audit(userId, 'subscription_cancelled', {
      planId: subscription.planId,
      platform: subscription.platform,
      transactionId: subscription.storeTransactionId ?? undefined,
      ipAddress,
    });

    this.logger.log(`Subscription cancelled: ${subscriptionId} for user=${userId}`);

    return {
      id: updated.id,
      status: 'cancelled',
      currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
    };
  }

  // ─── Subscription History ─────────────────────────────────

  async getSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        planId: true,
        status: true,
        platform: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelledAt: true,
        autoRenew: true,
        createdAt: true,
      },
    });
  }

  async getAuditLog(userId: string, page = 1, limit = 50) {
    const [entries, total] = await Promise.all([
      this.prisma.entitlementAudit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.entitlementAudit.count({ where: { userId } }),
    ]);

    return {
      data: entries,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Webhook Handler (for server-to-server store notifications) ─

  async handleStoreWebhook(
    platform: StorePlatform,
    payload: Record<string, unknown>,
  ) {
    // TODO: Implement store webhook handling
    // Apple: App Store Server Notifications V2
    // Google: Real-time Developer Notifications via Pub/Sub
    //
    // This method should:
    // 1. Verify the webhook signature/authenticity
    // 2. Extract the event type (renewal, cancel, refund, etc.)
    // 3. Find the user by storeTransactionId
    // 4. Update subscription status accordingly
    // 5. Audit log the event

    this.logger.log(`Store webhook received: platform=${platform}, type=${payload.type ?? 'unknown'}`);
    return { received: true };
  }

  // ─── Helpers ──────────────────────────────────────────────

  private async getActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
        currentPeriodEnd: { gte: new Date() },
      },
      orderBy: { currentPeriodEnd: 'desc' },
    });
  }

  private async audit(
    userId: string,
    action: EntitlementAuditAction,
    data: {
      planId?: string;
      platform?: string;
      transactionId?: string;
      entitlements?: unknown;
      details?: unknown;
      ipAddress?: string;
    },
  ) {
    await this.prisma.entitlementAudit.create({
      data: {
        userId,
        action,
        planId: data.planId,
        platform: data.platform,
        transactionId: data.transactionId,
        entitlements: data.entitlements as object ?? undefined,
        details: data.details as object ?? undefined,
        ipAddress: data.ipAddress,
      },
    });
  }

  private toPrismaStatus(status: string) {
    return status.toUpperCase() as 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED';
  }

  private toPrismaPlan(planId: PlanId) {
    return planId.toUpperCase() as 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | 'FAMILY';
  }

  private toPrismaPlatform(platform: StorePlatform) {
    return platform.toUpperCase() as 'APP_STORE' | 'PLAY_STORE' | 'WEB' | 'MANUAL';
  }
}
