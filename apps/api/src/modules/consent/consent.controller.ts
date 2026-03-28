import {
  Controller,
  Get,
  Post,
  Body,
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
import { ConsentService } from './consent.service';
import { GrantConsentDto, GrantBulkConsentsDto, RevokeConsentDto } from './dto';

@ApiTags('Consent')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users/me/consents')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all consents for current user' })
  @ApiResponse({ status: 200, description: 'Consent records returned' })
  async getConsents(@Req() req: Request & { user: { id: string } }) {
    return this.consentService.getUserConsents(req.user.id);
  }

  @Post('grant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Grant a consent' })
  @ApiResponse({ status: 200, description: 'Consent granted' })
  async grantConsent(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: GrantConsentDto,
  ) {
    return this.consentService.grantConsent(
      req.user.id,
      dto,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Post('grant/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Grant multiple consents at once (e.g., onboarding)' })
  @ApiResponse({ status: 200, description: 'Consents granted' })
  async grantBulk(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: GrantBulkConsentsDto,
  ) {
    return this.consentService.grantBulk(
      req.user.id,
      dto.consents,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a consent' })
  @ApiResponse({ status: 200, description: 'Consent revoked' })
  async revokeConsent(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: RevokeConsentDto,
  ) {
    return this.consentService.revokeConsent(
      req.user.id,
      dto,
      req.ip,
      req.get('user-agent'),
    );
  }
}
