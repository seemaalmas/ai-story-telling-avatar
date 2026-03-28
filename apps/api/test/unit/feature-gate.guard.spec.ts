import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureGateGuard } from '../../src/modules/subscription/guards/feature-gate.guard';
import { EntitlementService } from '../../src/modules/subscription/services/entitlement.service';

describe('FeatureGateGuard', () => {
  let guard: FeatureGateGuard;
  let reflector: Reflector;
  let entitlementService: jest.Mocked<EntitlementService>;

  const createMockContext = (userId?: string): ExecutionContext => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: userId ? { id: userId } : undefined,
        entitlements: undefined,
      }),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext);

  beforeEach(() => {
    reflector = new Reflector();
    entitlementService = {
      getEntitlements: jest.fn(),
      hasFeature: jest.fn(),
    } as unknown as jest.Mocked<EntitlementService>;

    guard = new FeatureGateGuard(reflector, entitlementService);
  });

  it('should pass when no features are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext('user-1');

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should pass when user has all required features', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['stories_unlimited']);
    entitlementService.getEntitlements.mockResolvedValue({
      plan: 'premium_monthly',
      status: 'active',
      features: ['stories_unlimited', 'voice_custom', 'languages_all', 'templates_premium', 'ads_free', 'offline_stories'],
      storiesPerDay: -1,
      languageCount: 10,
      customVoice: true,
      familySharing: false,
      adsFree: true,
    });

    const context = createMockContext('user-1');
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks features', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['stories_unlimited', 'voice_custom']);
    entitlementService.getEntitlements.mockResolvedValue({
      plan: 'free',
      status: 'active',
      features: ['stories_basic', 'voice_default', 'languages_basic', 'templates_basic'],
      storiesPerDay: 3,
      languageCount: 3,
      customVoice: false,
      familySharing: false,
      adsFree: false,
    });

    const context = createMockContext('user-1');
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should include missing features and upgrade URL in error', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['voice_custom']);
    entitlementService.getEntitlements.mockResolvedValue({
      plan: 'free',
      status: 'active',
      features: ['stories_basic', 'voice_default', 'languages_basic', 'templates_basic'],
      storiesPerDay: 3,
      languageCount: 3,
      customVoice: false,
      familySharing: false,
      adsFree: false,
    });

    const context = createMockContext('user-1');

    try {
      await guard.canActivate(context);
      fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      const response = (err as ForbiddenException).getResponse() as Record<string, unknown>;
      expect(response.requiredFeatures).toContain('voice_custom');
      expect(response.currentPlan).toBe('free');
      expect(response.upgradeUrl).toBe('/paywall');
    }
  });

  it('should throw when user is not authenticated', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['stories_unlimited']);
    const context = createMockContext(undefined); // no user

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
