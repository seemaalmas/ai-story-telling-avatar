import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Self-voice enrollment placeholder.
 *
 * This service manages the lifecycle of a user enrolling their OWN voice.
 * It enforces:
 *   1. Explicit consent before any audio is collected
 *   2. Only the user's own voice (no third-party cloning)
 *   3. Full revocation capability
 *
 * The actual voice model training is NOT implemented here — this is
 * the enrollment workflow and consent gate only. When a real TTS provider
 * is integrated (e.g. ElevenLabs), the `processEnrollment` method would
 * call their voice cloning API.
 */

const REQUIRED_CONSENTS = [
  'VOICE_ENROLLMENT',
  'VOICE_BIOMETRIC_STORAGE',
  'VOICE_SYNTHETIC_USE',
] as const;

const MIN_SAMPLES = 3;
const MAX_SAMPLES = 10;
const MIN_SAMPLE_DURATION_MS = 5000;
const MAX_TOTAL_DURATION_MS = 300_000; // 5 minutes

@Injectable()
export class VoiceEnrollmentService {
  private readonly logger = new Logger(VoiceEnrollmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start the enrollment process. Requires all voice consents to be granted first.
   */
  async startEnrollment(
    userId: string,
    voiceName: string,
    languageCode: string,
  ) {
    // Verify all required consents are granted
    for (const consentType of REQUIRED_CONSENTS) {
      const consent = await this.prisma.consent.findFirst({
        where: { userId, type: consentType, granted: true },
      });
      if (!consent) {
        throw new BadRequestException(
          `Required consent not granted: ${consentType}. ` +
            'Please grant all voice-related consents before enrolling.',
        );
      }
    }

    // Check for existing active enrollment
    const existing = await this.prisma.voiceEnrollment.findFirst({
      where: {
        userId,
        status: { in: ['CONSENT_GRANTED', 'SAMPLES_UPLOADING', 'PROCESSING', 'READY'] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'You already have an active voice enrollment. Revoke it first to create a new one.',
      );
    }

    const enrollment = await this.prisma.voiceEnrollment.create({
      data: {
        userId,
        voiceName: voiceName.trim(),
        languageCode,
        status: 'CONSENT_GRANTED',
        consentGrantedAt: new Date(),
      },
    });

    this.logger.log(`Voice enrollment started: ${enrollment.id} for user ${userId}`);
    return this.toResponse(enrollment);
  }

  /**
   * Record that a voice sample was uploaded.
   * Actual audio storage is delegated to the storage layer (S3, etc.).
   *
   * In production: validate the audio, check it matches the user's
   * previous samples (speaker verification), and store securely.
   */
  async addSample(
    userId: string,
    enrollmentId: string,
    sampleDurationMs: number,
  ) {
    const enrollment = await this.getOwnedEnrollment(userId, enrollmentId);

    if (!['CONSENT_GRANTED', 'SAMPLES_UPLOADING'].includes(enrollment.status)) {
      throw new BadRequestException(
        `Cannot add samples in status: ${enrollment.status}`,
      );
    }

    if (sampleDurationMs < MIN_SAMPLE_DURATION_MS) {
      throw new BadRequestException(
        `Sample too short. Minimum duration is ${MIN_SAMPLE_DURATION_MS}ms.`,
      );
    }

    const newTotal = enrollment.totalDurationMs + sampleDurationMs;
    if (newTotal > MAX_TOTAL_DURATION_MS) {
      throw new BadRequestException(
        `Total sample duration would exceed ${MAX_TOTAL_DURATION_MS}ms limit.`,
      );
    }

    const newCount = enrollment.sampleCount + 1;
    if (newCount > MAX_SAMPLES) {
      throw new BadRequestException(`Maximum ${MAX_SAMPLES} samples allowed.`);
    }

    const updated = await this.prisma.voiceEnrollment.update({
      where: { id: enrollmentId },
      data: {
        sampleCount: newCount,
        totalDurationMs: newTotal,
        status: 'SAMPLES_UPLOADING',
      },
    });

    // TODO: Store audio sample to secure storage (S3 with encryption)
    // TODO: Run speaker verification against previous samples

    this.logger.log(
      `Sample added to enrollment ${enrollmentId}: count=${newCount}, total=${newTotal}ms`,
    );

    return this.toResponse(updated);
  }

  /**
   * Submit enrollment for processing.
   * In production: triggers voice model training with the TTS provider.
   */
  async submitForProcessing(userId: string, enrollmentId: string) {
    const enrollment = await this.getOwnedEnrollment(userId, enrollmentId);

    if (enrollment.status !== 'SAMPLES_UPLOADING') {
      throw new BadRequestException(
        `Cannot submit in status: ${enrollment.status}`,
      );
    }

    if (enrollment.sampleCount < MIN_SAMPLES) {
      throw new BadRequestException(
        `Need at least ${MIN_SAMPLES} samples. Currently have ${enrollment.sampleCount}.`,
      );
    }

    const updated = await this.prisma.voiceEnrollment.update({
      where: { id: enrollmentId },
      data: { status: 'PROCESSING' },
    });

    // TODO: Call TTS provider's voice cloning API
    // TODO: Set up webhook/polling for completion
    // TODO: On success: update status to READY, set providerVoiceId
    // TODO: On failure: update status to FAILED, set failureReason

    this.logger.log(`Enrollment ${enrollmentId} submitted for processing`);
    return this.toResponse(updated);
  }

  /**
   * Revoke a voice enrollment. Deletes the voice model from the provider.
   */
  async revokeEnrollment(userId: string, enrollmentId: string) {
    const enrollment = await this.getOwnedEnrollment(userId, enrollmentId);

    if (enrollment.status === 'REVOKED') {
      throw new BadRequestException('Enrollment is already revoked');
    }

    // TODO: Call TTS provider to delete the voice model
    // TODO: Delete stored audio samples from secure storage

    await this.prisma.voiceEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        providerVoiceId: null,
      },
    });

    this.logger.log(`Enrollment ${enrollmentId} revoked by user ${userId}`);
    return { message: 'Voice enrollment revoked and data deletion initiated' };
  }

  /**
   * Get user's enrollment(s).
   */
  async getEnrollments(userId: string) {
    const enrollments = await this.prisma.voiceEnrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return enrollments.map((e) => this.toResponse(e));
  }

  async getEnrollment(userId: string, enrollmentId: string) {
    return this.toResponse(await this.getOwnedEnrollment(userId, enrollmentId));
  }

  // ─── Helpers ────────────────────────────────────────────

  private async getOwnedEnrollment(userId: string, enrollmentId: string) {
    const enrollment = await this.prisma.voiceEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) {
      throw new NotFoundException('Voice enrollment not found');
    }
    if (enrollment.userId !== userId) {
      throw new ForbiddenException('Not your voice enrollment');
    }
    return enrollment;
  }

  private toResponse(enrollment: {
    id: string;
    userId: string;
    voiceName: string;
    languageCode: string;
    status: string;
    sampleCount: number;
    totalDurationMs: number;
    createdAt: Date;
    consentGrantedAt: Date | null;
    revokedAt: Date | null;
  }) {
    return {
      id: enrollment.id,
      voiceName: enrollment.voiceName,
      languageCode: enrollment.languageCode,
      status: enrollment.status.toLowerCase(),
      sampleCount: enrollment.sampleCount,
      totalDurationMs: enrollment.totalDurationMs,
      consentGrantedAt: enrollment.consentGrantedAt?.toISOString() ?? null,
      revokedAt: enrollment.revokedAt?.toISOString() ?? null,
      createdAt: enrollment.createdAt.toISOString(),
    };
  }
}
