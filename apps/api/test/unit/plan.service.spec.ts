import { PlanService } from '../../src/modules/subscription/services/plan.service';

describe('PlanService', () => {
  let service: PlanService;

  beforeEach(() => {
    service = new PlanService();
  });

  describe('getAllPlans', () => {
    it('should return all 4 plans', () => {
      const plans = service.getAllPlans();
      expect(plans).toHaveLength(4);
      expect(plans.map((p) => p.id)).toEqual(['free', 'premium_monthly', 'premium_yearly', 'family']);
    });

    it('should have free plan at ₹0', () => {
      const free = service.getPlan('free');
      expect(free).toBeDefined();
      expect(free!.priceInr).toBe(0);
      expect(free!.intervalMonths).toBe(0);
    });

    it('should have correct pricing for premium monthly', () => {
      const plan = service.getPlan('premium_monthly');
      expect(plan!.priceInr).toBe(149);
      expect(plan!.intervalMonths).toBe(1);
    });

    it('should have store product IDs on paid plans', () => {
      const monthly = service.getPlan('premium_monthly');
      expect(monthly!.appStoreProductId).toBeDefined();
      expect(monthly!.playStoreProductId).toBeDefined();
    });
  });

  describe('getPlanByStoreProductId', () => {
    it('should find plan by App Store product ID', () => {
      const plan = service.getPlanByStoreProductId('com.katha.ai.premium.monthly');
      expect(plan).toBeDefined();
      expect(plan!.id).toBe('premium_monthly');
    });

    it('should find plan by Play Store product ID', () => {
      const plan = service.getPlanByStoreProductId('premium_yearly');
      expect(plan).toBeDefined();
      expect(plan!.id).toBe('premium_yearly');
    });

    it('should return undefined for unknown product ID', () => {
      expect(service.getPlanByStoreProductId('unknown')).toBeUndefined();
    });
  });

  describe('resolveEntitlements', () => {
    it('should return free entitlements for free plan', () => {
      const e = service.resolveEntitlements('free', 'active');
      expect(e.plan).toBe('free');
      expect(e.storiesPerDay).toBe(3);
      expect(e.customVoice).toBe(false);
      expect(e.adsFree).toBe(false);
      expect(e.familySharing).toBe(false);
    });

    it('should return premium entitlements for active premium', () => {
      const e = service.resolveEntitlements('premium_monthly', 'active', '2025-12-31');
      expect(e.plan).toBe('premium_monthly');
      expect(e.storiesPerDay).toBe(-1); // unlimited
      expect(e.customVoice).toBe(true);
      expect(e.adsFree).toBe(true);
      expect(e.languageCount).toBe(10);
      expect(e.expiresAt).toBe('2025-12-31');
    });

    it('should return free entitlements for cancelled premium', () => {
      const e = service.resolveEntitlements('premium_monthly', 'cancelled');
      expect(e.plan).toBe('free');
      expect(e.storiesPerDay).toBe(3);
      expect(e.customVoice).toBe(false);
    });

    it('should return free entitlements for expired premium', () => {
      const e = service.resolveEntitlements('premium_yearly', 'expired');
      expect(e.plan).toBe('free');
    });

    it('should include family sharing for family plan', () => {
      const e = service.resolveEntitlements('family', 'active');
      expect(e.familySharing).toBe(true);
    });

    it('should grant entitlements for trialing status', () => {
      const e = service.resolveEntitlements('premium_monthly', 'trialing');
      expect(e.plan).toBe('premium_monthly');
      expect(e.storiesPerDay).toBe(-1);
    });
  });
});
