import { Module } from '@nestjs/common';
import { VoicePipelineController } from './voice-pipeline.controller';
import { TTSService } from './services/tts.service';
import { STTService } from './services/stt.service';
import { VoiceEnrollmentService } from './services/voice-enrollment.service';
import { AbuseReportService } from './services/abuse-report.service';

@Module({
  controllers: [VoicePipelineController],
  providers: [TTSService, STTService, VoiceEnrollmentService, AbuseReportService],
  exports: [TTSService, STTService, VoiceEnrollmentService, AbuseReportService],
})
export class VoicePipelineModule {}
