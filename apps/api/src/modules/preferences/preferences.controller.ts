import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
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
import { PreferencesService } from './preferences.service';
import { SetPreferenceDto, SetBulkPreferencesDto } from './dto';

@ApiTags('Preferences')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users/me/preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user preferences (decrypted)' })
  @ApiResponse({ status: 200, description: 'All preferences returned' })
  async getAll(@Req() req: { user: { id: string } }) {
    return this.preferencesService.getAll(req.user.id);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a single preference by key' })
  @ApiResponse({ status: 200, description: 'Preference value returned' })
  @ApiResponse({ status: 404, description: 'Preference not found' })
  async get(
    @Req() req: { user: { id: string } },
    @Param('key') key: string,
  ) {
    const value = await this.preferencesService.get(req.user.id, key);
    return { key, value };
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set a single preference (auto-encrypts sensitive keys)' })
  @ApiResponse({ status: 204, description: 'Preference set' })
  async set(
    @Req() req: { user: { id: string } },
    @Body() dto: SetPreferenceDto,
  ) {
    await this.preferencesService.set(req.user.id, dto);
  }

  @Put('bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set multiple preferences at once' })
  @ApiResponse({ status: 204, description: 'Preferences set' })
  async setBulk(
    @Req() req: { user: { id: string } },
    @Body() dto: SetBulkPreferencesDto,
  ) {
    await this.preferencesService.setBulk(req.user.id, dto.preferences);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a preference' })
  @ApiResponse({ status: 204, description: 'Preference deleted' })
  async delete(
    @Req() req: { user: { id: string } },
    @Param('key') key: string,
  ) {
    await this.preferencesService.delete(req.user.id, key);
  }
}
