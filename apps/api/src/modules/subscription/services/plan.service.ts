import { Injectable } from '@nestjs/common';
import type { PlanDefinition, PlanId, Feature, Entitlements } from '@katha/shared';

const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with 3 stories per day',
    priceInr: 0,
    intervalMonths: 0,
    features: ['stories_basic', 'voice_default', 'languages_basic', 'templates_basic'],
  },
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    description: 'Unlimited stories, all languages, custom voice',
    priceInr: 149,
    intervalMonths: 1,
    features: ['stories_unlimited', 'voice_custom', 'languages_all', 'templates_premium', 'ads_free', 'offline_stories'],
    appStoreProductId: 'com.katha.ai.premium.monthly',
    playStoreProductId: 'premium_monthly',
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    description: 'Everything in Premium at 44% off',
    priceInr: 999,
    intervalMonths: 12,
    features: ['stories_unlimited', 'voice_custom', 'languages_all', 'templates_premium', 'ads_free', 'offline_stories'],
    appStoreProductId: 'com.katha.ai.premium.yearly',
    playStoreProductId: 'premium_yearly',
  },
  {
    id: 'family',
    name: 'Family Plan',
    description: 'Premium for the whole family',
    priceInr: 249,
    intervalMonths: 1,
    features: ['stories_unlimited', 'voice_custom', 'languages_all', 'templates_premium', 'ads_free', 'offline_stories', 'family_sharing'],
    maxFamilyMembers: 5,
    appStoreProductId: 'com.katha.ai.family.monthly',
    playStoreProductId: 'family_monthly',
  },
];

@Injectable()
export class PlanService {
  getAllPlans(): PlanDefinition[] {
    return PLANS;
  }

  getPlan(planId: PlanId): PlanDefinition | undefined {
    return PLANS.find((p) => p.id === planId);
  }

  getPlanByStoreProductId(productId: string): PlanDefinition | undefined {
    return PLANS.find(
      (p) => p.appStoreProductId === productId || p.playStoreProductId === productId,
    );
  }

  /**
   * Resolve entitlements for a given plan and status.
   */
  resolveEntitlements(planId: PlanId, status: string, expiresAt?: string): Entitlements {
    const isActive = ['active', 'trialing'].includes(status);

    if (!isActive || planId === 'free') {
      return {
        plan: 'free',
        status: status as Entitlements['status'],
        features: ['stories_basic', 'voice_default', 'languages_basic', 'templates_basic'],
        storiesPerDay: 3,
        languageCount: 3,
        customVoice: false,
        familySharing: false,
        adsFree: false,
        expiresAt,
      };
    }

    const plan = this.getPlan(planId);
    const features = (plan?.features ?? []) as Feature[];

    return {
      plan: planId,
      status: status as Entitlements['status'],
      features,
      storiesPerDay: -1, // unlimited
      languageCount: 10,
      customVoice: features.includes('voice_custom'),
      familySharing: features.includes('family_sharing'),
      adsFree: features.includes('ads_free'),
      expiresAt,
    };
  }
}
