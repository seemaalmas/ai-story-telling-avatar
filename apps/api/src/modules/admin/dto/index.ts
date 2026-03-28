import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn, IsInt, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertFeatureFlagDto {
  @ApiProperty({ example: 'story_engine_enabled' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rules?: object;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isKillSwitch?: boolean;
}

export class ResolveReportDto {
  @ApiProperty({ enum: ['RESOLVED_ACTION_TAKEN', 'RESOLVED_NO_ACTION', 'DISMISSED'] })
  @IsIn(['RESOLVED_ACTION_TAKEN', 'RESOLVED_NO_ACTION', 'DISMISSED'])
  resolution: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAvatarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class ToggleLanguageDto {
  @ApiProperty({ example: 'hi' })
  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] })
  @IsIn(['USER', 'ADMIN', 'SUPER_ADMIN'])
  role: string;
}

export class PaginationQueryDto {
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

export class AuditLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource?: string;
}
