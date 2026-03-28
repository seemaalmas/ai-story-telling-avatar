import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { EntitlementService } from './services/entitlement.service';
import { PlanService } from './services/plan.service';
import { ReceiptValidatorService } from './services/receipt-validator.service';
import { FeatureGateGuard } from './guards/feature-gate.guard';

@Module({
  controllers: [SubscriptionController],
  providers: [
    EntitlementService,
    PlanService,
    ReceiptValidatorService,
    FeatureGateGuard,
  ],
  exports: [EntitlementService, PlanService, FeatureGateGuard],
})
export class SubscriptionModule {}
