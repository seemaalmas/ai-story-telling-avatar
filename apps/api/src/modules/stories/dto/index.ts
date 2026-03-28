import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateStoryDto {
  @ApiProperty({ example: 'The Brave Tiger' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Tell me a story about a brave tiger in the Sundarbans' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ example: 'hi', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarId?: string;
}

export class UpdateStoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;
}

export class ListStoriesQueryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'GENERATING', 'COMPLETED', 'FAILED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'GENERATING', 'COMPLETED', 'FAILED'])
  status?: string;
}
