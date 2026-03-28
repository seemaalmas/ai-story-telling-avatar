import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── TTS ────────────────────────────────────────────────────

const VALID_LANGUAGES = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'kn', 'gu', 'ml', 'pa'];

export class SynthesizeSpeechDto {
  @ApiProperty({ example: 'Once upon a time, in a village near the Ganges...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Text must be under 5000 characters' })
  text: string;

  @ApiProperty({ example: 'hi', enum: VALID_LANGUAGES })
  @IsIn(VALID_LANGUAGES, { message: 'Unsupported language' })
  languageCode: string;

  @ApiPropertyOptional({ example: 'mock-dadi' })
  @IsOptional()
  @IsString()
  voiceId?: string;

  @ApiPropertyOptional({ example: 1.0, description: 'Speed multiplier (0.5 to 2.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  speed?: number;

  @ApiPropertyOptional({ description: 'If true, return streaming audio' })
  @IsOptional()
  streaming?: boolean;
}

// ─── STT ────────────────────────────────────────────────────

export class TranscribeDto {
  @ApiProperty({ example: 'hi-IN', description: 'BCP-47 language code' })
  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @ApiPropertyOptional({ example: 'wav', enum: ['wav', 'mp3', 'ogg', 'webm', 'flac'] })
  @IsOptional()
  @IsIn(['wav', 'mp3', 'ogg', 'webm', 'flac'])
  format?: string;
}

// ─── Voice Enrollment ───────────────────────────────────────

export class StartEnrollmentDto {
  @ApiProperty({ example: 'My Voice' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  voiceName: string;

  @ApiProperty({ example: 'hi-IN' })
  @IsString()
  @IsNotEmpty()
  languageCode: string;
}

export class AddSampleDto {
  @ApiProperty({ description: 'Duration of the uploaded sample in ms' })
  @IsInt()
  @Min(5000, { message: 'Sample must be at least 5 seconds' })
  @Max(60000, { message: 'Sample must be at most 60 seconds' })
  durationMs: number;
}

// ─── Abuse Report ───────────────────────────────────────────

const ABUSE_CATEGORIES = [
  'impersonation',
  'harassment',
  'deepfake',
  'unauthorized_voice_use',
  'hate_speech',
  'other',
];

export class CreateAbuseReportDto {
  @ApiProperty({ enum: ['voice_output', 'voice_enrollment', 'story_content'] })
  @IsIn(['voice_output', 'voice_enrollment', 'story_content'])
  targetType: string;

  @ApiProperty({ description: 'ID of the reported content' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ enum: ABUSE_CATEGORIES })
  @IsIn(ABUSE_CATEGORIES, { message: 'Invalid abuse category' })
  category: string;

  @ApiProperty({ example: 'This voice sounds like it is impersonating a public figure.' })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(2000)
  description: string;
}

// ─── Voice List ─────────────────────────────────────────────

export class ListVoicesQueryDto {
  @ApiProperty({ example: 'hi', description: 'Language code to filter voices' })
  @IsString()
  @IsNotEmpty()
  language: string;
}
