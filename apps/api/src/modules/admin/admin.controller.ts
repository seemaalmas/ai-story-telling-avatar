import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { Roles, RolesGuard } from '../../common/guards/roles.guard';
import { FeatureFlagService } from './services/feature-flag.service';
import { AdminModerationService } from './services/admin-moderation.service';
import { AdminAuditService } from './services/admin-audit.service';
import {
  UpsertFeatureFlagDto, ResolveReportDto, UpdateAvatarDto,
  ToggleLanguageDto, UpdateUserRoleDto, PaginationQueryDto, AuditLogQueryDto,
} from './dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly flags: FeatureFlagService,
    private readonly moderation: AdminModerationService,
    private readonly audit: AdminAuditService,
  ) {}

  // ─── Dashboard ────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  async dashboard() {
    return this.moderation.getDashboardStats();
  }

  // ─── Feature Flags ────────────────────────────────────

  @Get('flags')
  @ApiOperation({ summary: 'List all feature flags' })
  async getFlags() { return this.flags.getAll(); }

  @Post('flags')
  @ApiOperation({ summary: 'Create or update a feature flag' })
  async upsertFlag(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpsertFeatureFlagDto,
  ) {
    return this.flags.upsert(req.user.id, dto.key, dto, req.ip);
  }

  @Delete('flags/:key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a feature flag' })
  async deleteFlag(
    @Req() req: Request & { user: { id: string } },
    @Param('key') key: string,
  ) {
    return this.flags.delete(req.user.id, key, req.ip);
  }

  @Post('flags/seed')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Seed default feature flags' })
  async seedFlags() { return this.flags.seedDefaults(); }

  // ─── Kill Switch (convenience endpoints) ──────────────

  @Post('kill-switch/:key/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a kill switch (disable a feature)' })
  async activateKillSwitch(
    @Req() req: Request & { user: { id: string } },
    @Param('key') key: string,
  ) {
    return this.flags.upsert(req.user.id, key, { enabled: false, isKillSwitch: true }, req.ip);
  }

  @Post('kill-switch/:key/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a kill switch (re-enable a feature)' })
  async deactivateKillSwitch(
    @Req() req: Request & { user: { id: string } },
    @Param('key') key: string,
  ) {
    return this.flags.upsert(req.user.id, key, { enabled: true, isKillSwitch: true }, req.ip);
  }

  // ─── Abuse Reports ────────────────────────────────────

  @Get('reports')
  @ApiOperation({ summary: 'List abuse reports (filterable by status)' })
  async getReports(
    @Query() query: PaginationQueryDto & { status?: string },
  ) {
    return this.moderation.getAbuseReports(query.page, query.limit, query.status);
  }

  @Post('reports/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve an abuse report' })
  async resolveReport(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.moderation.resolveAbuseReport(req.user.id, id, dto.resolution, dto.notes, req.ip);
  }

  // ─── Avatar Catalog ───────────────────────────────────

  @Get('avatars')
  @ApiOperation({ summary: 'List all avatars' })
  async getAvatars(@Query() query: PaginationQueryDto) {
    return this.moderation.getAvatars(query.page, query.limit);
  }

  @Patch('avatars/:id')
  @ApiOperation({ summary: 'Update an avatar (name, description, visibility)' })
  async updateAvatar(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateAvatarDto,
  ) {
    return this.moderation.updateAvatar(req.user.id, id, dto, req.ip);
  }

  // ─── Story Packs ─────────────────────────────────────

  @Get('stories/stats')
  @ApiOperation({ summary: 'Story generation statistics' })
  async storyStats() { return this.moderation.getStoryStats(); }

  // ─── Languages ────────────────────────────────────────

  @Get('languages')
  @ApiOperation({ summary: 'Get language pack enable/disable states' })
  async getLanguages() { return this.moderation.getLanguageStates(); }

  @Post('languages/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable or disable a language pack' })
  async toggleLanguage(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: ToggleLanguageDto,
  ) {
    return this.moderation.toggleLanguage(req.user.id, dto.languageCode, dto.enabled, req.ip);
  }

  // ─── Users ────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List users with search' })
  async getUsers(@Query() query: PaginationQueryDto & { search?: string }) {
    return this.moderation.getUsers(query.page, query.limit, query.search);
  }

  @Post('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Change user role (SUPER_ADMIN only)' })
  async updateRole(
    @Req() req: Request & { user: { id: string } },
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.moderation.updateUserRole(req.user.id, userId, dto.role as 'USER' | 'ADMIN' | 'SUPER_ADMIN', req.ip);
  }

  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban a user (deactivate account)' })
  async banUser(
    @Req() req: Request & { user: { id: string } },
    @Param('id') userId: string,
  ) {
    return this.moderation.banUser(req.user.id, userId, req.ip);
  }

  // ─── Audit Trail ──────────────────────────────────────

  @Get('audit-log')
  @ApiOperation({ summary: 'Admin audit trail' })
  async getAuditLog(@Query() query: AuditLogQueryDto) {
    return this.audit.getLog(query.page, query.limit, {
      action: query.action,
      resource: query.resource,
    });
  }
}
