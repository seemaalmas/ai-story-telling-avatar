import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetPreferenceDto {
  @ApiProperty({ example: 'theme', description: 'Preference key (alphanumeric, underscores)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Key must be alphanumeric with underscores only' })
  key: string;

  @ApiProperty({ example: 'dark', description: 'Preference value' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  value: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Force encryption (auto-detected for sensitive keys)',
  })
  @IsOptional()
  @IsBoolean()
  encrypted?: boolean;
}

export class SetBulkPreferencesDto {
  @ApiProperty({ type: [SetPreferenceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetPreferenceDto)
  preferences: SetPreferenceDto[];
}
