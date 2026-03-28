import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { CreateStoryDto, UpdateStoryDto, ListStoriesQueryDto } from './dto';

@ApiTags('Stories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new story' })
  async create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateStoryDto,
  ) {
    return this.storiesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List user stories' })
  async findAll(
    @Request() req: { user: { id: string } },
    @Query() query: ListStoriesQueryDto,
  ) {
    return this.storiesService.findAll(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a story by ID' })
  async findOne(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.storiesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a story' })
  async update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateStoryDto,
  ) {
    return this.storiesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a story' })
  async remove(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.storiesService.remove(req.user.id, id);
  }
}
