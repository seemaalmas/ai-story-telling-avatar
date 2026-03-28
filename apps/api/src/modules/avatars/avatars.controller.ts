import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvatarsService } from './avatars.service';
import { CreateAvatarDto } from './dto';

@ApiTags('Avatars')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Get()
  @ApiOperation({ summary: 'List available avatars (public + user owned)' })
  async findAll(@Request() req: { user: { id: string } }) {
    return this.avatarsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get avatar by ID' })
  async findOne(@Param('id') id: string) {
    return this.avatarsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom avatar' })
  async create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateAvatarDto,
  ) {
    return this.avatarsService.create(req.user.id, dto);
  }
}
