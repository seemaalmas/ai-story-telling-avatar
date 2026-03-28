import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TooManyRequestsException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { OtpService } from '../../src/modules/auth/services/otp.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: jest.Mocked<PrismaService>;

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'auth.otp') {
        return {
          length: 6,
          expiryMinutes: 10,
          maxAttempts: 5,
          rateLimitTtl: 60000,
          rateLimitMax: 3,
        };
      }
      return null;
    }),
  };

  const mockPrisma = {
    otpCode: {
      count: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('should generate OTP successfully', async () => {
      mockPrisma.otpCode.count.mockResolvedValue(0);
      mockPrisma.otpCode.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.otpCode.create.mockResolvedValue({ id: 'otp-1' });

      const result = await service.generateOtp('test@example.com', 'LOGIN');

      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(mockPrisma.otpCode.updateMany).toHaveBeenCalledWith({
        where: { email: 'test@example.com', purpose: 'LOGIN', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(mockPrisma.otpCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          purpose: 'LOGIN',
          maxAttempts: 5,
          code: expect.stringMatching(/^\d{6}$/),
        }),
      });
    });

    it('should throw TooManyRequestsException when rate limited', async () => {
      mockPrisma.otpCode.count.mockResolvedValue(3);

      await expect(service.generateOtp('test@example.com', 'LOGIN')).rejects.toThrow(
        TooManyRequestsException,
      );
    });

    it('should link OTP to existing user', async () => {
      mockPrisma.otpCode.count.mockResolvedValue(0);
      mockPrisma.otpCode.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      mockPrisma.otpCode.create.mockResolvedValue({ id: 'otp-1' });

      await service.generateOtp('test@example.com', 'LOGIN');

      expect(mockPrisma.otpCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 'user-1' }),
      });
    });
  });

  describe('verifyOtp', () => {
    const validOtp = {
      id: 'otp-1',
      code: '123456',
      email: 'test@example.com',
      purpose: 'LOGIN',
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 600000),
      usedAt: null,
    };

    it('should verify valid OTP successfully', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue(validOtp);
      mockPrisma.otpCode.update.mockResolvedValue({});

      await expect(
        service.verifyOtp('test@example.com', '123456', 'LOGIN'),
      ).resolves.toBeUndefined();

      expect(mockPrisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: 'otp-1' },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('should throw when no active OTP found', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp('test@example.com', '123456', 'LOGIN'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when OTP is expired', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({
        ...validOtp,
        expiresAt: new Date(Date.now() - 1000),
      });
      mockPrisma.otpCode.update.mockResolvedValue({});

      await expect(
        service.verifyOtp('test@example.com', '123456', 'LOGIN'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when max attempts exceeded', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({
        ...validOtp,
        attempts: 5,
      });
      mockPrisma.otpCode.update.mockResolvedValue({});

      await expect(
        service.verifyOtp('test@example.com', '123456', 'LOGIN'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should increment attempts on wrong code', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue(validOtp);
      mockPrisma.otpCode.update.mockResolvedValue({});

      await expect(
        service.verifyOtp('test@example.com', '000000', 'LOGIN'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: 'otp-1' },
        data: { attempts: { increment: 1 } },
      });
    });

    it('should show correct remaining attempts message', async () => {
      mockPrisma.otpCode.findFirst.mockResolvedValue({
        ...validOtp,
        attempts: 3,
      });
      mockPrisma.otpCode.update.mockResolvedValue({});

      await expect(
        service.verifyOtp('test@example.com', '000000', 'LOGIN'),
      ).rejects.toThrow(/1 attempt remaining/);
    });
  });
});
