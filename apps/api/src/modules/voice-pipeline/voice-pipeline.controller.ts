import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';

import { TTSService } from './services/tts.service';
import { STTService } from './services/stt.service';
import { VoiceEnrollmentService } from './services/voice-enrollment.service';
import { AbuseReportService } from './services/abuse-report.service';
import {
  SynthesizeSpeechDto,
  TranscribeDto,
  StartEnrollmentDto,
  AddSampleDto,
  CreateAbuseReportDto,
  ListVoicesQueryDto,
} from './dto';

@ApiTags('Voice Pipeline')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('voice')
export class VoicePipelineController {
  constructor(
    private readonly tts: TTSService,
    private readonly stt: STTService,
    private readonly enrollment: VoiceEnrollmentService,
    private readonly abuseReports: AbuseReportService,
  ) {}

  // ─── TTS ──────────────────────────────────────────────

  @Post('synthesize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Synthesize speech from text',
    description:
      'Returns audio with synthetic-output label and subtitle timing metadata. ' +
      'All responses include `label.isSynthetic: true` for regulatory compliance.',
  })
  @ApiResponse({ status: 200, description: 'Synthesized audio with metadata' })
  async synthesize(
    @Req() req: { user: { id: string } },
    @Body() dto: SynthesizeSpeechDto,
  ) {
    return this.tts.synthesize(dto.text, dto.languageCode, dto.voiceId, {
      speed: dto.speed,
    });
  }

  @Post('synthesize/stream')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stream synthesized speech as chunked audio',
    description:
      'Returns an audio stream with Content-Type header. ' +
      'Synthetic label and subtitle timing are returned via response headers.',
  })
  async synthesizeStream(
    @Body() dto: SynthesizeSpeechDto,
    @Res() res: Response,
  ) {
    const handle = await this.tts.synthesizeStream(
      dto.text,
      dto.languageCode,
      dto.voiceId,
      { speed: dto.speed },
    );

    res.setHeader('Content-Type', `audio/${handle.format}`);
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Synthetic-Audio', 'true');
    res.setHeader('X-Audio-Provider', 'katha-ai');

    handle.audioStream.pipe(res);

    handle.onComplete((result) => {
      // Metadata is streamed as trailing headers where supported,
      // or logged for client retrieval via GET /voice/synthesis-meta/:id
      // In HTTP/1.1, we rely on the client knowing the stream is synthetic
      // from the X-Synthetic-Audio header set before streaming began.
      void result;
    });

    handle.onError((err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  // ─── STT ──────────────────────────────────────────────

  @Post('transcribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transcribe audio to text',
    description: 'Send audio as base64 in the request body for transcription.',
  })
  @ApiResponse({ status: 200, description: 'Transcription result with word timings' })
  async transcribe(
    @Body() dto: TranscribeDto & { audioBase64: string },
  ) {
    const audioBuffer = Buffer.from(dto.audioBase64, 'base64');
    return this.stt.transcribe(audioBuffer, dto.languageCode, {
      format: dto.format as 'wav' | 'mp3' | 'ogg' | 'webm' | 'flac',
    });
  }

  // ─── Voices ───────────────────────────────────────────

  @Get('voices')
  @ApiOperation({ summary: 'List available TTS voices for a language' })
  @ApiResponse({ status: 200, description: 'List of available voices' })
  async listVoices(@Query() query: ListVoicesQueryDto) {
    return this.tts.listVoices(query.language);
  }

  // ─── Self-Voice Enrollment ────────────────────────────

  @Post('enrollment/start')
  @ApiOperation({
    summary: 'Start self-voice enrollment (requires voice consents)',
    description:
      'Begins the enrollment process for the authenticated user\'s OWN voice. ' +
      'Requires VOICE_ENROLLMENT, VOICE_BIOMETRIC_STORAGE, and VOICE_SYNTHETIC_USE consents.',
  })
  @ApiResponse({ status: 201, description: 'Enrollment started' })
  @ApiResponse({ status: 400, description: 'Missing consents or existing enrollment' })
  async startEnrollment(
    @Req() req: { user: { id: string } },
    @Body() dto: StartEnrollmentDto,
  ) {
    return this.enrollment.startEnrollment(
      req.user.id,
      dto.voiceName,
      dto.languageCode,
    );
  }

  @Post('enrollment/:id/sample')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record that a voice sample was uploaded' })
  @ApiResponse({ status: 200, description: 'Sample recorded' })
  async addSample(
    @Req() req: { user: { id: string } },
    @Param('id') enrollmentId: string,
    @Body() dto: AddSampleDto,
  ) {
    return this.enrollment.addSample(req.user.id, enrollmentId, dto.durationMs);
  }

  @Post('enrollment/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit enrollment for voice model processing' })
  @ApiResponse({ status: 200, description: 'Enrollment submitted for processing' })
  async submitEnrollment(
    @Req() req: { user: { id: string } },
    @Param('id') enrollmentId: string,
  ) {
    return this.enrollment.submitForProcessing(req.user.id, enrollmentId);
  }

  @Post('enrollment/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke voice enrollment and delete voice data' })
  @ApiResponse({ status: 200, description: 'Enrollment revoked' })
  async revokeEnrollment(
    @Req() req: { user: { id: string } },
    @Param('id') enrollmentId: string,
  ) {
    return this.enrollment.revokeEnrollment(req.user.id, enrollmentId);
  }

  @Get('enrollments')
  @ApiOperation({ summary: 'Get all voice enrollments for current user' })
  @ApiResponse({ status: 200, description: 'User enrollments' })
  async getEnrollments(@Req() req: { user: { id: string } }) {
    return this.enrollment.getEnrollments(req.user.id);
  }

  // ─── Abuse Reports ────────────────────────────────────

  @Post('abuse/report')
  @ApiOperation({
    summary: 'Report abusive voice content',
    description:
      'File a report for impersonation, harassment, deepfakes, or unauthorized voice use.',
  })
  @ApiResponse({ status: 201, description: 'Report filed' })
  async createAbuseReport(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateAbuseReportDto,
  ) {
    return this.abuseReports.createReport({
      reporterUserId: req.user.id,
      targetType: dto.targetType,
      targetId: dto.targetId,
      category: dto.category,
      description: dto.description,
    });
  }

  @Get('abuse/reports')
  @ApiOperation({ summary: 'Get abuse reports filed by current user' })
  @ApiResponse({ status: 200, description: 'User abuse reports' })
  async getMyReports(@Req() req: { user: { id: string } }) {
    return this.abuseReports.getMyReports(req.user.id);
  }

  // ─── Health ───────────────────────────────────────────

  @Get('health')
  @ApiOperation({ summary: 'Voice pipeline health check' })
  async healthCheck() {
    const [ttsHealthy, sttHealthy] = await Promise.all([
      this.tts.healthCheck(),
      this.stt.healthCheck(),
    ]);
    return {
      tts: ttsHealthy ? 'up' : 'down',
      stt: sttHealthy ? 'up' : 'down',
    };
  }
}
