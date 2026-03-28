import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { PreferencesService } from '../../src/modules/preferences/preferences.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { encrypt, decrypt } from '../../src/common/utils';

describe('PreferencesService', () => {
  let service: PreferencesService;
  const encryptionSecret = 'test-secret-key-32-chars-long!!';

  const mockPrisma = {
    userPreference: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'app.encryptionSecret') return encryptionSecret;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return decrypted preferences', async () => {
      const encryptedValue = encrypt('secret-data', encryptionSecret);

      mockPrisma.userPreference.findMany.mockResolvedValue([
        { key: 'theme', value: 'dark', encrypted: false },
        { key: 'phone_number', value: encryptedValue, encrypted: true },
      ]);

      const result = await service.getAll('user-1');

      expect(result.theme).toBe('dark');
      expect(result.phone_number).toBe('secret-data');
    });
  });

  describe('get', () => {
    it('should return a single preference', async () => {
      mockPrisma.userPreference.findUnique.mockResolvedValue({
        key: 'theme',
        value: 'dark',
        encrypted: false,
      });

      const result = await service.get('user-1', 'theme');
      expect(result).toBe('dark');
    });

    it('should throw NotFoundException for missing key', async () => {
      mockPrisma.userPreference.findUnique.mockResolvedValue(null);

      await expect(service.get('user-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('should decrypt encrypted preference', async () => {
      const encryptedValue = encrypt('my-phone', encryptionSecret);

      mockPrisma.userPreference.findUnique.mockResolvedValue({
        key: 'phone_number',
        value: encryptedValue,
        encrypted: true,
      });

      const result = await service.get('user-1', 'phone_number');
      expect(result).toBe('my-phone');
    });
  });

  describe('set', () => {
    it('should upsert a plain preference', async () => {
      mockPrisma.userPreference.upsert.mockResolvedValue({});

      await service.set('user-1', { key: 'theme', value: 'dark' });

      expect(mockPrisma.userPreference.upsert).toHaveBeenCalledWith({
        where: { userId_key: { userId: 'user-1', key: 'theme' } },
        create: expect.objectContaining({
          key: 'theme',
          value: 'dark',
          encrypted: false,
        }),
        update: expect.objectContaining({
          value: 'dark',
          encrypted: false,
        }),
      });
    });

    it('should auto-encrypt sensitive keys', async () => {
      mockPrisma.userPreference.upsert.mockResolvedValue({});

      await service.set('user-1', {
        key: 'phone_number',
        value: '+91-9876543210',
      });

      const callArgs = mockPrisma.userPreference.upsert.mock.calls[0][0];

      // Value should be encrypted (not the plain text)
      expect(callArgs.create.value).not.toBe('+91-9876543210');
      expect(callArgs.create.encrypted).toBe(true);

      // But should be decryptable
      const decrypted = decrypt(callArgs.create.value, encryptionSecret);
      expect(decrypted).toBe('+91-9876543210');
    });

    it('should respect explicit encrypted flag', async () => {
      mockPrisma.userPreference.upsert.mockResolvedValue({});

      await service.set('user-1', {
        key: 'custom_secret',
        value: 'private-data',
        encrypted: true,
      });

      const callArgs = mockPrisma.userPreference.upsert.mock.calls[0][0];
      expect(callArgs.create.encrypted).toBe(true);
      expect(callArgs.create.value).not.toBe('private-data');
    });
  });

  describe('delete', () => {
    it('should delete a preference', async () => {
      mockPrisma.userPreference.deleteMany.mockResolvedValue({ count: 1 });

      await service.delete('user-1', 'theme');

      expect(mockPrisma.userPreference.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', key: 'theme' },
      });
    });
  });

  describe('deleteAll', () => {
    it('should delete all preferences for a user', async () => {
      mockPrisma.userPreference.deleteMany.mockResolvedValue({ count: 3 });

      await service.deleteAll('user-1');

      expect(mockPrisma.userPreference.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
