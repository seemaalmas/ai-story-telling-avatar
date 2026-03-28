import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsArray,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_PLATFORMS = ['app_store', 'play_store', 'web', 'manual'];

export class PurchaseDto {
  @ApiProperty({ enum: VALID_PLATFORMS, example: 'app_store' })
  @IsIn(VALID_PLATFORMS)
  platform: string;

  @ApiProperty({ description: 'Receipt data from the app store' })
  @IsString()
  @IsNotEmpty()
  receipt: string;

  @ApiProperty({ example: 'com.katha.ai.premium.monthly' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Store transaction ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

class ReceiptItem {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  receipt: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId?: string;
}

export class RestorePurchasesDto {
  @ApiProperty({ enum: VALID_PLATFORMS })
  @IsIn(VALID_PLATFORMS)
  platform: string;

  @ApiProperty({ type: [ReceiptItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItem)
  receipts: ReceiptItem[];
}

export class CancelSubscriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;
}

export class AuditLogQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
