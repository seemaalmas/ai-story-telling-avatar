import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoryDto, UpdateStoryDto, ListStoriesQueryDto } from './dto';

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateStoryDto) {
    const story = await this.prisma.story.create({
      data: {
        ...dto,
        userId,
        status: 'DRAFT',
      },
      include: { avatar: true },
    });

    // TODO: Enqueue story generation job via BullMQ
    return story;
  }

  async findAll(userId: string, query: ListStoriesQueryDto) {
    const { page = 1, limit = 20, language, status } = query;

    const where = {
      userId,
      ...(language && { language }),
      ...(status && { status: status as 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'FAILED' }),
    };

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        include: { avatar: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.story.count({ where }),
    ]);

    return {
      data: stories,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string, id: string) {
    const story = await this.prisma.story.findFirst({
      where: { id, userId },
      include: { avatar: true },
    });

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    return story;
  }

  async update(userId: string, id: string, dto: UpdateStoryDto) {
    await this.findOne(userId, id);

    return this.prisma.story.update({
      where: { id },
      data: dto,
      include: { avatar: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.story.delete({ where: { id } });
    return { message: 'Story deleted' };
  }
}
