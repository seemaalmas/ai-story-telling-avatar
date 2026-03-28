import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const VALID_LANGUAGES = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'kn', 'gu', 'ml', 'pa'];

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Priya Sharma' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 'hi', enum: VALID_LANGUAGES })
  @IsOptional()
  @IsString()
  @IsIn(VALID_LANGUAGES, { message: 'Unsupported language code' })
  preferredLanguage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
