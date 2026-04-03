import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { generateOtpCode } from '../../../common/utils';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async generateOtp(email: string, purpose = 'LOGIN'): Promise<{ expiresAt: Date; code?: string }> {
    const otpConfig = this.config.get('auth.otp');

    // Rate limit: count OTPs created in the last TTL window
    const windowStart = new Date(Date.now() - otpConfig.rateLimitTtl);
    const recentCount = await this.prisma.otpCode.count({
      where: {
        email,
        purpose,
        createdAt: { gte: windowStart },
      },
    });

    if (recentCount >= otpConfig.rateLimitMax) {
      throw new HttpException(
        'Too many OTP requests. Please wait before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Invalidate any existing unused OTPs for this email+purpose
    await this.prisma.otpCode.updateMany({
      where: { email, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    const code = generateOtpCode(otpConfig.length);
    const expiresAt = new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);

    // Look up user if exists (for linking)
    const user = await this.prisma.user.findUnique({ where: { email } });

    await this.prisma.otpCode.create({
      data: {
        code,
        email,
        purpose,
        maxAttempts: otpConfig.maxAttempts,
        userId: user?.id ?? null,
        expiresAt,
      },
    });

    // TODO: Send OTP via email/SMS service (e.g. SendGrid, AWS SES)
    this.logger.log(`OTP generated for ${email} (purpose: ${purpose}): ${code}`);

    // In development, return the code in the response so it can be tested
    const isDev = process.env.NODE_ENV === 'development';
    return { expiresAt, ...(isDev && { code }) };
  }

  async verifyOtp(email: string, code: string, purpose = 'LOGIN'): Promise<void> {
    const otp = await this.prisma.otpCode.findFirst({
      where: {
        email,
        purpose,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException('No active OTP found. Please request a new one.');
    }

    if (otp.expiresAt < new Date()) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      });
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    if (otp.attempts >= otp.maxAttempts) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      });
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please request a new OTP.',
      );
    }

    if (otp.code !== code) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = otp.maxAttempts - otp.attempts - 1;
      throw new UnauthorizedException(
        `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      );
    }

    // Mark as used
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
  }
}
