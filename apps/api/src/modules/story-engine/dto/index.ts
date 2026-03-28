import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const VALID_MODES = ['bedtime', 'warrior_success', 'mythology', 'motivation'];
const VALID_TONES = ['calm', 'funny', 'energetic'];
const VALID_LANGUAGES = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'kn', 'gu', 'ml', 'pa'];

export class StartStoryDto {
  @ApiProperty({
    enum: VALID_MODES,
    example: 'mythology',
    description: 'Story mode determines the narrative style and source material',
  })
  @IsIn(VALID_MODES, { message: 'Mode must be one of: bedtime, warrior_success, mythology, motivation' })
  mode: string;

  @ApiProperty({
    enum: VALID_TONES,
    example: 'calm',
    description: 'Narrative tone',
  })
  @IsIn(VALID_TONES, { message: 'Tone must be one of: calm, funny, energetic' })
  tone: string;

  @ApiProperty({ example: 'hi', enum: VALID_LANGUAGES })
  @IsIn(VALID_LANGUAGES, { message: 'Unsupported language' })
  language: string;

  @ApiPropertyOptional({ description: 'Avatar ID for the narrator' })
  @IsOptional()
  @IsString()
  avatarId?: string;

  @ApiPropertyOptional({ description: 'Seed ID to start from a pre-made scenario' })
  @IsOptional()
  @IsString()
  seedId?: string;

  @ApiPropertyOptional({
    example: 'Tell me a story about a brave girl who tames a river dragon',
    description: 'Free-form story prompt (ignored if seedId is provided)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Prompt must be under 1000 characters' })
  prompt?: string;
}

export class ContinueStoryDto {
  @ApiProperty({ description: 'Active story session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Selected choice ID from the current node' })
  @IsString()
  @IsNotEmpty()
  choiceId: string;
}

export class EndStoryDto {
  @ApiProperty({ description: 'Story session ID to end' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class GetSessionDto {
  @ApiProperty({ description: 'Story session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class ListSessionsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
