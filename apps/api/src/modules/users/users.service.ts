import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        preferredLanguage: true,
        role: true,
        authProvider: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateProfileDto) {
    // Verify user exists
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.preferredLanguage && { preferredLanguage: dto.preferredLanguage }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        preferredLanguage: true,
        role: true,
        authProvider: true,
        emailVerified: true,
        updatedAt: true,
      },
    });
  }

  async deactivate(id: string) {
    await this.findById(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Revoke all sessions and tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    await this.prisma.deviceSession.updateMany({
      where: { userId: id },
      data: { isActive: false },
    });

    return { message: 'Account deactivated' };
  }

  async deleteAccount(id: string) {
    await this.findById(id);

    // Cascade deletes handle related records via Prisma schema
    await this.prisma.user.delete({ where: { id } });

    return { message: 'Account deleted permanently' };
  }
}
