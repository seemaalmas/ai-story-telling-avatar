import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAvatarDto } from './dto';

@Injectable()
export class AvatarsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.avatar.findMany({
      where: {
        OR: [{ isPublic: true }, { userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const avatar = await this.prisma.avatar.findUnique({ where: { id } });
    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }
    return avatar;
  }

  async create(userId: string, dto: CreateAvatarDto) {
    return this.prisma.avatar.create({
      data: { ...dto, userId },
    });
  }
}
