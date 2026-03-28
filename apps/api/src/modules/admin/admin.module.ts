import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { FeatureFlagService } from './services/feature-flag.service';
import { AdminModerationService } from './services/admin-moderation.service';
import { AdminAuditService } from './services/admin-audit.service';

@Module({
  controllers: [AdminController],
  providers: [FeatureFlagService, AdminModerationService, AdminAuditService],
  exports: [FeatureFlagService, AdminAuditService],
})
export class AdminModule {}
