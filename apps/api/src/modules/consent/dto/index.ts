import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum ConsentType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  MARKETING_EMAIL = 'MARKETING_EMAIL',
  DATA_PROCESSING = 'DATA_PROCESSING',
  ANALYTICS = 'ANALYTICS',
  PUSH_NOTIFICATIONS = 'PUSH_NOTIFICATIONS',
}

export class GrantConsentDto {
  @ApiProperty({ enum: ConsentType, example: 'PRIVACY_POLICY' })
  @IsEnum(ConsentType, { message: 'Invalid consent type' })
  type: ConsentType;

  @ApiPropertyOptional({ example: '1.0', default: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;
}

export class GrantBulkConsentsDto {
  @ApiProperty({ type: [GrantConsentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrantConsentDto)
  consents: GrantConsentDto[];
}

export class RevokeConsentDto {
  @ApiProperty({ enum: ConsentType, example: 'MARKETING_EMAIL' })
  @IsEnum(ConsentType, { message: 'Invalid consent type' })
  type: ConsentType;
}
