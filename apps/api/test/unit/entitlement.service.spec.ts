import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntitlementService } from '../../src/modules/subscription/services/entitlement.service';
import { PlanService } from '../../src/modules/subscription/services/plan.service';
import { ReceiptValidatorService } from '../../src/modules/subscription/services/receipt-validator.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('EntitlementService', () => {
  let service: EntitlementService;
  const planService = new PlanService();

  const mockPrisma = {
    subscription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    entitlementAudit: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockReceiptValidator = {
    validate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementService,
        { provide: PlanService, useValue: planService },
        { provide: ReceiptValidatorService, useValue: mockReceiptValidator },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EntitlementService>(EntitlementService);
    jest.clearAllMocks();
    mockPrisma.entitlementAudit.create.mockResolvedValue({});
  });

  describe('getEntitlements', () => {
    it('should return free entitlements when no subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const e = await service.getEntitlements('user-1');

      expect(e.plan).toBe('free');
      expect(e.storiesPerDay).toBe(3);
      expect(e.customVoice).toBe(false);
    });

    it('should return premium entitlements for active subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        planId: 'PREMIUM_MONTHLY',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });

      const e = await service.getEntitlements('user-1');

      expect(e.plan).toBe('premium_monthly');
      expect(e.storiesPerDay).toBe(-1);
      expect(e.customVoice).toBe(true);
      expect(e.adsFree).toBe(true);
    });
  });

  describe('processPurchase', () => {
    it('should create subscription on valid receipt', async () => {
      mockReceiptValidator.validate.mockResolvedValue({
        valid: true,
        productId: 'com.katha.ai.premium.monthly',
        transactionId: 'txn_123',
        platform: 'app_store',
        expiresAt: new Date(Date.now() + 2592000000).toISOString(),
        isRenewal: false,
      });

      mockPrisma.subscription.upsert.mockResolvedValue({
        id: 'sub-1',
        planId: 'PREMIUM_MONTHLY',
        status: 'ACTIVE',
        platform: 'APP_STORE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 2592000000),
      });

      const result = await service.processPurchase(
        'user-1',
        'app_store',
        'mock_receipt',
        'com.katha.ai.premium.monthly',
      );

      expect(result.subscription.planId).toBe('premium_monthly');
      expect(result.subscription.status).toBe('active');
      expect(result.entitlements.storiesPerDay).toBe(-1);
      expect(mockPrisma.entitlementAudit.create).toHaveBeenCalledTimes(2); // receipt_validated + subscription_created
    });

    it('should throw on invalid receipt', async () => {
      mockReceiptValidator.validate.mockResolvedValue({
        valid: false,
        productId: 'com.katha.ai.premium.monthly',
        transactionId: '',
        platform: 'app_store',
        isRenewal: false,
        error: 'Invalid receipt',
      });

      await expect(
        service.processPurchase('user-1', 'app_store', 'bad_receipt', 'com.katha.ai.premium.monthly'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.entitlementAudit.create).toHaveBeenCalledTimes(2); // receipt_validated + receipt_validation_failed
    });

    it('should throw on unknown product ID', async () => {
      mockReceiptValidator.validate.mockResolvedValue({
        valid: true,
        productId: 'unknown_product',
        transactionId: 'txn_x',
        platform: 'app_store',
        isRenewal: false,
      });

      await expect(
        service.processPurchase('user-1', 'app_store', 'mock_receipt', 'unknown_product'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should audit renewal vs new purchase', async () => {
      mockReceiptValidator.validate.mockResolvedValue({
        valid: true,
        productId: 'com.katha.ai.premium.monthly',
        transactionId: 'txn_renew',
        platform: 'app_store',
        expiresAt: new Date(Date.now() + 2592000000).toISOString(),
        isRenewal: true,
      });

      mockPrisma.subscription.upsert.mockResolvedValue({
        id: 'sub-1',
        planId: 'PREMIUM_MONTHLY',
        status: 'ACTIVE',
        platform: 'APP_STORE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 2592000000),
      });

      await service.processPurchase('user-1', 'app_store', 'mock_renewal_receipt', 'com.katha.ai.premium.monthly');

      // Should audit as subscription_renewed, not subscription_created
      const auditCalls = mockPrisma.entitlementAudit.create.mock.calls;
      const actions = auditCalls.map((c: Array<{ data: { action: string } }>) => c[0].data.action);
      expect(actions).toContain('subscription_renewed');
    });
  });

  describe('restorePurchases', () => {
    it('should process multiple receipts and return results', async () => {
      mockReceiptValidator.validate.mockResolvedValue({
        valid: true,
        productId: 'com.katha.ai.premium.yearly',
        transactionId: 'txn_restore',
        platform: 'app_store',
        expiresAt: new Date(Date.now() + 31536000000).toISOString(),
        isRenewal: false,
      });

      mockPrisma.subscription.upsert.mockResolvedValue({
        id: 'sub-r',
        planId: 'PREMIUM_YEARLY',
        status: 'ACTIVE',
        platform: 'APP_STORE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 31536000000),
      });

      mockPrisma.subscription.findFirst.mockResolvedValue({
        planId: 'PREMIUM_YEARLY',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 31536000000),
      });

      const result = await service.restorePurchases('user-1', 'app_store', [
        { receipt: 'mock_receipt_1', productId: 'com.katha.ai.premium.yearly' },
      ]);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].restored).toBe(true);
      expect(result.entitlements.plan).toBe('premium_yearly');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel and audit', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        userId: 'user-1',
        planId: 'PREMIUM_MONTHLY',
        platform: 'APP_STORE',
        storeTransactionId: 'txn_1',
      });

      mockPrisma.subscription.update.mockResolvedValue({
        id: 'sub-1',
        status: 'CANCELLED',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });

      const result = await service.cancelSubscription('user-1', 'sub-1');

      expect(result.status).toBe('cancelled');
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({ status: 'CANCELLED', autoRenew: false }),
      });
    });

    it('should throw for nonexistent subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelSubscription('user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('hasFeature', () => {
    it('should return true for free user with basic feature', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      expect(await service.hasFeature('user-1', 'stories_basic')).toBe(true);
    });

    it('should return false for free user with premium feature', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      expect(await service.hasFeature('user-1', 'stories_unlimited')).toBe(false);
    });
  });

  describe('getAuditLog', () => {
    it('should return paginated audit log', async () => {
      mockPrisma.entitlementAudit.findMany.mockResolvedValue([{ id: 'a1', action: 'subscription_created' }]);
      mockPrisma.entitlementAudit.count.mockResolvedValue(1);

      const result = await service.getAuditLog('user-1');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
