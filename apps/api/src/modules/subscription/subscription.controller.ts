import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
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
import { Request } from 'express';

import { EntitlementService } from './services/entitlement.service';
import { PlanService } from './services/plan.service';
import {
  PurchaseDto,
  RestorePurchasesDto,
  CancelSubscriptionDto,
  AuditLogQueryDto,
} from './dto';

import type { StorePlatform } from '@katha/shared';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly entitlements: EntitlementService,
    private readonly plans: PlanService,
  ) {}

  // ─── Plans (public) ───────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'List all available plans and pricing' })
  @ApiResponse({ status: 200, description: 'Plan list' })
  async getPlans() {
    return this.plans.getAllPlans();
  }

  // ─── Entitlements ─────────────────────────────────────

  @Get('entitlements')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user entitlements and active features' })
  @ApiResponse({ status: 200, description: 'Current entitlements' })
  async getEntitlements(@Req() req: Request & { user: { id: string } }) {
    return this.entitlements.getEntitlements(req.user.id);
  }

  // ─── Purchase ─────────────────────────────────────────

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate a store receipt and activate subscription',
    description:
      'Send the receipt from App Store or Play Store. ' +
      'Server validates with the store and activates the subscription.',
  })
  @ApiResponse({ status: 200, description: 'Subscription activated' })
  @ApiResponse({ status: 400, description: 'Receipt validation failed' })
  async purchase(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: PurchaseDto,
  ) {
    return this.entitlements.processPurchase(
      req.user.id,
      dto.platform as StorePlatform,
      dto.receipt,
      dto.productId,
      dto.transactionId,
      req.ip,
    );
  }

  // ─── Restore ──────────────────────────────────────────

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restore previous purchases from app store',
    description: 'Send all receipts from the device. Server validates each and restores entitlements.',
  })
  @ApiResponse({ status: 200, description: 'Restore results with entitlements' })
  async restore(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: RestorePurchasesDto,
  ) {
    return this.entitlements.restorePurchases(
      req.user.id,
      dto.platform as StorePlatform,
      dto.receipts,
      req.ip,
    );
  }

  // ─── Cancel ───────────────────────────────────────────

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a subscription (keeps access until period end)' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancel(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.entitlements.cancelSubscription(req.user.id, dto.subscriptionId, req.ip);
  }

  // ─── History ──────────────────────────────────────────

  @Get('subscriptions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all subscriptions for current user' })
  async getSubscriptions(@Req() req: Request & { user: { id: string } }) {
    return this.entitlements.getSubscriptions(req.user.id);
  }

  @Get('audit-log')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get entitlement audit log' })
  async getAuditLog(
    @Req() req: Request & { user: { id: string } },
    @Query() query: AuditLogQueryDto,
  ) {
    return this.entitlements.getAuditLog(req.user.id, query.page, query.limit);
  }

  // ─── Store Webhooks ───────────────────────────────────

  @Post('webhook/apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'App Store Server Notification webhook' })
  async appleWebhook(@Body() payload: Record<string, unknown>) {
    return this.entitlements.handleStoreWebhook('app_store', payload);
  }

  @Post('webhook/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google Play Real-time Developer Notification webhook' })
  async googleWebhook(@Body() payload: Record<string, unknown>) {
    return this.entitlements.handleStoreWebhook('play_store', payload);
  }
}
