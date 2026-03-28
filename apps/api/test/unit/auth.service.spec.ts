import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/modules/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { OtpService } from '../../src/modules/auth/services/otp.service';
import { DeviceSessionService } from '../../src/modules/auth/services/device-session.service';
import { GoogleAuthService } from '../../src/modules/auth/strategies/google.strategy';
import { AppleAuthService } from '../../src/modules/auth/strategies/apple.strategy';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const config: Record<string, unknown> = {
        'auth.jwtRefreshExpiresIn': '30d',
        'auth.maxDeviceSessions': 5,
      };
      return config[key];
    }),
  };

  const mockOtpService = {
    generateOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  const mockDeviceSessionService = {
    upsertSession: jest.fn(),
    getActiveSessions: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
  };

  const mockGoogleAuth = {
    verifyIdToken: jest.fn(),
  };

  const mockAppleAuth = {
    verifyIdentityToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: OtpService, useValue: mockOtpService },
        { provide: DeviceSessionService, useValue: mockDeviceSessionService },
        { provide: GoogleAuthService, useValue: mockGoogleAuth },
        { provide: AppleAuthService, useValue: mockAppleAuth },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password1',
        name: 'Test User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password1', 12);
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password1',
          name: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should normalize email to lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      await service.register({
        email: 'TEST@Example.COM',
        password: 'Password1',
        name: 'Test',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('login', () => {
    const existingUser = {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-pw',
      isActive: true,
    };

    it('should login with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(existingUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password1',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'bad@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for deactivated account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...existingUser,
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'Password1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should create device session when device info provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(existingUser);
      mockDeviceSessionService.upsertSession.mockResolvedValue('session-1');
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password1',
        device: { deviceId: 'dev-1', deviceName: 'iPhone' },
      });

      expect(result.sessionId).toBe('session-1');
      expect(mockDeviceSessionService.upsertSession).toHaveBeenCalled();
    });
  });

  describe('verifyOtpAndLogin', () => {
    it('should login existing user after OTP verification', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isActive: true,
        emailVerified: true,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.verifyOtpAndLogin({
        email: 'test@example.com',
        code: '123456',
      });

      expect(result).toHaveProperty('accessToken');
      expect(mockOtpService.verifyOtp).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
        'LOGIN',
      );
    });

    it('should create new user on first OTP login with name', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-new',
        email: 'new@example.com',
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.verifyOtpAndLogin({
        email: 'new@example.com',
        code: '123456',
        name: 'New User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new@example.com',
          name: 'New User',
          emailVerified: true,
        }),
      });
    });

    it('should throw BadRequestException for new user without name', async () => {
      mockOtpService.verifyOtp.mockResolvedValue(undefined);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyOtpAndLogin({
          email: 'new@example.com',
          code: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should rotate tokens', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: 'old-token',
        userId: 'user-1',
        deviceSessionId: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', email: 'test@example.com', isActive: true },
        deviceSession: null,
      });
      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshToken('old-token');

      expect(result).toHaveProperty('accessToken');
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
      });
    });

    it('should throw for expired refresh token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        expiresAt: new Date(Date.now() - 1000),
        user: { isActive: true },
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw for deactivated user', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', email: 'test@example.com', isActive: false },
        deviceSession: null,
      });

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh token and revoke session', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        deviceSessionId: 'session-1',
      });
      mockPrisma.refreshToken.delete.mockResolvedValue({});
      mockDeviceSessionService.revokeSession.mockResolvedValue(undefined);

      const result = await service.logout('some-token');

      expect(result.message).toBe('Logged out successfully');
      expect(mockDeviceSessionService.revokeSession).toHaveBeenCalledWith(
        'user-1',
        'session-1',
      );
    });

    it('should logout from all devices when requested', async () => {
      mockDeviceSessionService.revokeAllSessions.mockResolvedValue(undefined);
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.logout('some-token', true, 'user-1');

      expect(result.message).toBe('Logged out from all devices');
      expect(mockDeviceSessionService.revokeAllSessions).toHaveBeenCalledWith('user-1');
    });
  });
});
