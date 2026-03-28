import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from './services/otp.service';
import {
  DeviceSessionService,
  DeviceInfo,
} from './services/device-session.service';
import { GoogleAuthService } from './strategies/google.strategy';
import { AppleAuthService } from './strategies/apple.strategy';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  DeviceInfoDto,
} from './dto';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly otpService: OtpService,
    private readonly deviceSessionService: DeviceSessionService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly appleAuthService: AppleAuthService,
  ) {}

  // ── Email/Password Registration ─────────────────────────

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        name: dto.name.trim(),
        passwordHash,
        authProvider: 'EMAIL',
        preferredLanguage: dto.preferredLanguage ?? 'en',
      },
    });

    this.logger.log(`User registered: ${user.email}`);
    return this.generateTokens(user.id, user.email);
  }

  // ── Email/Password Login ────────────────────────────────

  async login(dto: LoginDto): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const deviceInfo = dto.device ? this.toDeviceInfo(dto.device) : undefined;
    return this.generateTokens(user.id, user.email, deviceInfo);
  }

  // ── OTP Login Flow ──────────────────────────────────────

  async requestOtp(email: string, purpose = 'LOGIN') {
    return this.otpService.generateOtp(email.toLowerCase().trim(), purpose);
  }

  async verifyOtpAndLogin(dto: VerifyOtpDto): Promise<AuthTokens> {
    const email = dto.email.toLowerCase().trim();

    await this.otpService.verifyOtp(email, dto.code, dto.purpose ?? 'LOGIN');

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      if (!dto.name) {
        throw new BadRequestException(
          'Name is required for first-time login. Please provide a name.',
        );
      }

      user = await this.prisma.user.create({
        data: {
          email,
          name: dto.name.trim(),
          authProvider: 'EMAIL',
          emailVerified: true,
        },
      });
      this.logger.log(`New user created via OTP: ${email}`);
    } else {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Mark email as verified on successful OTP
      if (!user.emailVerified) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const deviceInfo = dto.device ? this.toDeviceInfo(dto.device) : undefined;
    return this.generateTokens(user.id, user.email, deviceInfo);
  }

  // ── Google Sign-In ──────────────────────────────────────

  async loginWithGoogle(
    idToken: string,
    device?: DeviceInfoDto,
  ): Promise<AuthTokens> {
    const profile = await this.googleAuthService.verifyIdToken(idToken);

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { authProvider: 'GOOGLE', authProviderId: profile.id },
          { email: profile.email },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.displayName,
          avatarUrl: profile.photoUrl,
          authProvider: 'GOOGLE',
          authProviderId: profile.id,
          emailVerified: true,
        },
      });
      this.logger.log(`New user created via Google: ${profile.email}`);
    } else {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          authProviderId: user.authProviderId ?? profile.id,
          avatarUrl: user.avatarUrl ?? profile.photoUrl,
          emailVerified: true,
        },
      });
    }

    const deviceInfo = device ? this.toDeviceInfo(device) : undefined;
    return this.generateTokens(user.id, user.email, deviceInfo);
  }

  // ── Apple Sign-In ───────────────────────────────────────

  async loginWithApple(
    identityToken: string,
    userInfo?: { firstName?: string; lastName?: string },
    device?: DeviceInfoDto,
  ): Promise<AuthTokens> {
    const profile = await this.appleAuthService.verifyIdentityToken(
      identityToken,
      userInfo,
    );

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { authProvider: 'APPLE', authProviderId: profile.id },
          { email: profile.email },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.displayName ?? 'Katha User',
          authProvider: 'APPLE',
          authProviderId: profile.id,
          emailVerified: true,
        },
      });
      this.logger.log(`New user created via Apple: ${profile.email}`);
    } else {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Update name if it was a placeholder and Apple now provides it
      const updates: Record<string, unknown> = {
        lastLoginAt: new Date(),
        authProviderId: user.authProviderId ?? profile.id,
        emailVerified: true,
      };

      if (user.name === 'Katha User' && profile.displayName) {
        updates.name = profile.displayName;
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
    }

    const deviceInfo = device ? this.toDeviceInfo(device) : undefined;
    return this.generateTokens(user.id, user.email, deviceInfo);
  }

  // ── Token Management ────────────────────────────────────

  async refreshToken(token: string): Promise<AuthTokens> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true, deviceSession: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Delete the used token (rotation)
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Touch device session
    if (storedToken.deviceSession?.isActive) {
      await this.prisma.deviceSession.update({
        where: { id: storedToken.deviceSession.id },
        data: { lastActiveAt: new Date() },
      });
    }

    return this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      undefined,
      storedToken.deviceSessionId ?? undefined,
    );
  }

  async logout(token: string, allDevices = false, userId?: string): Promise<{ message: string }> {
    if (allDevices && userId) {
      await this.deviceSessionService.revokeAllSessions(userId);
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
      return { message: 'Logged out from all devices' };
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (storedToken) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

      if (storedToken.deviceSessionId) {
        await this.deviceSessionService.revokeSession(
          storedToken.userId,
          storedToken.deviceSessionId,
        );
      }
    }

    return { message: 'Logged out successfully' };
  }

  // ── Session Management ──────────────────────────────────

  async getDeviceSessions(userId: string) {
    return this.deviceSessionService.getActiveSessions(userId);
  }

  async revokeDeviceSession(userId: string, sessionId: string) {
    await this.deviceSessionService.revokeSession(userId, sessionId);
    return { message: 'Session revoked' };
  }

  // ── Private Helpers ─────────────────────────────────────

  private async generateTokens(
    userId: string,
    email: string,
    device?: DeviceInfo,
    existingSessionId?: string,
  ): Promise<AuthTokens> {
    let sessionId = existingSessionId;

    if (device) {
      sessionId = await this.deviceSessionService.upsertSession(userId, device);
    }

    const payload = { sub: userId, email, sid: sessionId };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('auth.jwtRefreshExpiresIn'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        deviceSessionId: sessionId ?? null,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, sessionId };
  }

  private toDeviceInfo(dto: DeviceInfoDto): DeviceInfo {
    return {
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      deviceOS: dto.deviceOS,
      deviceOSVersion: dto.deviceOSVersion,
      appVersion: dto.appVersion,
    };
  }
}
