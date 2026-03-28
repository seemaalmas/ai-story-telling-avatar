import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementService } from '../services/entitlement.service';

export const REQUIRED_FEATURES_KEY = 'requiredFeatures';

/**
 * Decorator: require specific features to access a route.
 *
 * @example
 * @RequireFeatures('stories_unlimited', 'voice_custom')
 * @UseGuards(AuthGuard('jwt'), FeatureGateGuard)
 * async premiumEndpoint() { ... }
 */
export const RequireFeatures = (...features: string[]) =>
  SetMetadata(REQUIRED_FEATURES_KEY, features);

/**
 * Decorator: require any premium plan (shorthand for the most common case).
 */
export const RequirePremium = () =>
  SetMetadata(REQUIRED_FEATURES_KEY, ['stories_unlimited']);

@Injectable()
export class FeatureGateGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_FEATURES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No features required — pass through
    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const entitlements = await this.entitlementService.getEntitlements(userId);

    const missing = requiredFeatures.filter(
      (f) => !entitlements.features.includes(f as (typeof entitlements.features)[number]),
    );

    if (missing.length > 0) {
      throw new ForbiddenException({
        message: 'Premium subscription required',
        requiredFeatures: missing,
        currentPlan: entitlements.plan,
        upgradeUrl: '/paywall',
      });
    }

    // Attach entitlements to request for downstream use
    request.entitlements = entitlements;

    return true;
  }
}
