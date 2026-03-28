import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VoiceEnrollmentService } from '../../src/modules/voice-pipeline/services/voice-enrollment.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('VoiceEnrollmentService', () => {
  let service: VoiceEnrollmentService;

  const mockPrisma = {
    consent: {
      findFirst: jest.fn(),
    },
    voiceEnrollment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceEnrollmentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VoiceEnrollmentService>(VoiceEnrollmentService);
    jest.clearAllMocks();
  });

  describe('startEnrollment', () => {
    it('should create enrollment when all consents are granted', async () => {
      // All 3 consents granted
      mockPrisma.consent.findFirst.mockResolvedValue({ granted: true });
      mockPrisma.voiceEnrollment.findFirst.mockResolvedValue(null); // no existing
      mockPrisma.voiceEnrollment.create.mockResolvedValue({
        id: 'enroll-1',
        userId: 'user-1',
        voiceName: 'My Voice',
        languageCode: 'hi-IN',
        status: 'CONSENT_GRANTED',
        sampleCount: 0,
        totalDurationMs: 0,
        createdAt: new Date(),
        consentGrantedAt: new Date(),
        revokedAt: null,
      });

      const result = await service.startEnrollment('user-1', 'My Voice', 'hi-IN');

      expect(result.id).toBe('enroll-1');
      expect(result.status).toBe('consent_granted');
      expect(mockPrisma.consent.findFirst).toHaveBeenCalledTimes(3);
    });

    it('should throw if voice enrollment consent is missing', async () => {
      mockPrisma.consent.findFirst
        .mockResolvedValueOnce({ granted: true })  // VOICE_ENROLLMENT
        .mockResolvedValueOnce(null);               // VOICE_BIOMETRIC_STORAGE missing

      await expect(
        service.startEnrollment('user-1', 'My Voice', 'hi-IN'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if user already has an active enrollment', async () => {
      mockPrisma.consent.findFirst.mockResolvedValue({ granted: true });
      mockPrisma.voiceEnrollment.findFirst.mockResolvedValue({
        id: 'existing',
        status: 'READY',
      });

      await expect(
        service.startEnrollment('user-1', 'My Voice', 'hi-IN'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addSample', () => {
    const enrollment = {
      id: 'enroll-1',
      userId: 'user-1',
      status: 'CONSENT_GRANTED',
      sampleCount: 1,
      totalDurationMs: 10000,
    };

    it('should add sample to enrollment', async () => {
      mockPrisma.voiceEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrisma.voiceEnrollment.update.mockResolvedValue({
        ...enrollment,
        sampleCount: 2,
        totalDurationMs: 20000,
        status: 'SAMPLES_UPLOADING',
        voiceName: 'Voice',
        languageCode: 'en',
        createdAt: new Date(),
        consentGrantedAt: new Date(),
        revokedAt: null,
      });

      const result = await service.addSample('user-1', 'enroll-1', 10000);

      expect(result.sampleCount).toBe(2);
      expect(result.status).toBe('samples_uploading');
    });

    it('should reject sample shorter than 5 seconds', async () => {
      mockPrisma.voiceEnrollment.findUnique.mockResolvedValue(enrollment);

      await expect(
        service.addSample('user-1', 'enroll-1', 3000),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject sample exceeding total duration limit', async () => {
      mockPrisma.voiceEnrollment.findUnique.mockResolvedValue({
        ...enrollment,
        totalDurationMs: 295000, // almost at 300s limit
      });

      await expect(
        service.addSample('user-1', 'enroll-1', 10000), // would push over
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if not owned by user', async () => {
      mockPrisma.voiceEnrollment.findUnique.mockResolvedValue({
        ...enrollment,
        userId: 'other-user',
      });

      await expect(
        service.addSample('user-1', 'enroll-1', 10000),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submitForProcessing', () => {
    it('should submit when enough samples are present', async () => {
      const enrollment = {
        id: 'enroll-1',
        userId: 'user-1',
        status: 'SAMPLES_UPLOADING',
        sampleCount: 3,
        totalDurationMs: 30000,
      };
      mockPrisma.voiceEnrollment.findUnique.mockResolvedValue(enrollment);
      mockPrisma.voiceEnrollment.update.mockResolvedValue({
        ...enrollment,
        status: 'PROCESSING',
        voiceName: 'Voice',
        languageCode: 'en',
        createdAt: new Date(),
        consentGrantedAt: new Date(),
        revokedAt: null,
      });

      const result = await service.submitForProcessing('user-1', 'enroll-1');
      expect(result.status).toBe('processing');
    });

    it('should reject when too few samples', async () => {
      mockPrisma.voiceEnrollment.findUnique.mockResolvedValue({
        id: 'enroll-1',
        userId: 'user-1',
        status: 'SAMPLES_UPLOADING',
        sampleCount: 1,
      });

      await expect(
        service.submitForProcessing('user-1', 'enroll-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('revokeEnrollment', () => {
    it('should revoke and clear provider data', async () => {
      mockPrisma.voiceEnrollment.findUnique.mockResolvedValue({
        id: 'enroll-1',
        userId: 'user-1',
        status: 'READY',
      });
      mockPrisma.voiceEnrollment.update.mockResolvedValue({});

      const result = await service.revokeEnrollment('user-1', 'enroll-1');
      expect(result.message).toContain('revoked');
      expect(mockPrisma.voiceEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'enroll-1' },
        data: expect.objectContaining({
          status: 'REVOKED',
          providerVoiceId: null,
        }),
      });
    });

    it('should not revoke already-revoked enrollment', async () => {
      mockPrisma.voiceEnrollment.findUnique.mockResolvedValue({
        id: 'enroll-1',
        userId: 'user-1',
        status: 'REVOKED',
      });

      await expect(
        service.revokeEnrollment('user-1', 'enroll-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
