import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Specialized throttle guard for OTP endpoints.
 * More aggressive rate limiting than the global throttler.
 *
 * Applied via @UseGuards(OtpThrottleGuard) on OTP routes.
 * The actual limits are configured on the route via @Throttle().
 */
@Injectable()
export class OtpThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // Rate limit by IP + email combination to prevent abuse
    const ip = (req as { ip?: string }).ip ?? 'unknown';
    const body = req.body as { email?: string } | undefined;
    const email = body?.email ?? 'unknown';
    return `otp:${ip}:${email}`;
  }
}
