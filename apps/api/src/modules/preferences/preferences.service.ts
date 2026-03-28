import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { encrypt, decrypt } from '../../common/utils';
import { SetPreferenceDto } from './dto';

/** Keys that are always stored encrypted */
const SENSITIVE_KEYS = new Set([
  'payment_info',
  'phone_number',
  'address',
  'aadhaar_last4',
  'pan_number',
]);

@Injectable()
export class PreferencesService {
  private readonly encryptionSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.encryptionSecret = this.config.get<string>('app.encryptionSecret')!;
  }

  async getAll(userId: string): Promise<Record<string, string>> {
    const prefs = await this.prisma.userPreference.findMany({
      where: { userId },
    });

    const result: Record<string, string> = {};
    for (const pref of prefs) {
      result[pref.key] = pref.encrypted
        ? decrypt(pref.value, this.encryptionSecret)
        : pref.value;
    }
    return result;
  }

  async get(userId: string, key: string): Promise<string> {
    const pref = await this.prisma.userPreference.findUnique({
      where: { userId_key: { userId, key } },
    });

    if (!pref) {
      throw new NotFoundException(`Preference "${key}" not found`);
    }

    return pref.encrypted
      ? decrypt(pref.value, this.encryptionSecret)
      : pref.value;
  }

  async set(userId: string, dto: SetPreferenceDto): Promise<void> {
    const shouldEncrypt = dto.encrypted ?? SENSITIVE_KEYS.has(dto.key);

    const value = shouldEncrypt
      ? encrypt(dto.value, this.encryptionSecret)
      : dto.value;

    await this.prisma.userPreference.upsert({
      where: { userId_key: { userId, key: dto.key } },
      create: {
        userId,
        key: dto.key,
        value,
        encrypted: shouldEncrypt,
      },
      update: {
        value,
        encrypted: shouldEncrypt,
      },
    });
  }

  async setBulk(
    userId: string,
    preferences: SetPreferenceDto[],
  ): Promise<void> {
    await this.prisma.$transaction(
      preferences.map((dto) => {
        const shouldEncrypt = dto.encrypted ?? SENSITIVE_KEYS.has(dto.key);
        const value = shouldEncrypt
          ? encrypt(dto.value, this.encryptionSecret)
          : dto.value;

        return this.prisma.userPreference.upsert({
          where: { userId_key: { userId, key: dto.key } },
          create: { userId, key: dto.key, value, encrypted: shouldEncrypt },
          update: { value, encrypted: shouldEncrypt },
        });
      }),
    );
  }

  async delete(userId: string, key: string): Promise<void> {
    await this.prisma.userPreference.deleteMany({
      where: { userId, key },
    });
  }

  async deleteAll(userId: string): Promise<void> {
    await this.prisma.userPreference.deleteMany({ where: { userId } });
  }
}
