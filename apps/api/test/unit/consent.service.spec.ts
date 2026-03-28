import { Test, TestingModule } from '@nestjs/testing';
import { ConsentService } from '../../src/modules/consent/consent.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ConsentService', () => {
  let service: ConsentService;

  const mockPrisma = {
    consent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
    jest.clearAllMocks();
  });

  describe('getUserConsents', () => {
    it('should return all consents for a user', async () => {
      const consents = [
        {
          id: 'c1',
          type: 'PRIVACY_POLICY',
          granted: true,
          version: '1.0',
          grantedAt: new Date(),
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrisma.consent.findMany.mockResolvedValue(consents);

      const result = await service.getUserConsents('user-1');

      expect(result.consents).toEqual(consents);
      expect(mockPrisma.consent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
        select: expect.any(Object),
      });
    });
  });

  describe('grantConsent', () => {
    it('should upsert a consent record', async () => {
      const consent = {
        id: 'c1',
        type: 'PRIVACY_POLICY',
        granted: true,
        version: '1.0',
        grantedAt: expect.any(Date),
      };
      mockPrisma.consent.upsert.mockResolvedValue(consent);

      const result = await service.grantConsent(
        'user-1',
        { type: 'PRIVACY_POLICY' as never, version: '1.0' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result).toEqual(consent);
      expect(mockPrisma.consent.upsert).toHaveBeenCalledWith({
        where: {
          userId_type_version: {
            userId: 'user-1',
            type: 'PRIVACY_POLICY',
            version: '1.0',
          },
        },
        create: expect.objectContaining({
          userId: 'user-1',
          type: 'PRIVACY_POLICY',
          granted: true,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        }),
        update: expect.objectContaining({
          granted: true,
          revokedAt: null,
        }),
      });
    });
  });

  describe('grantBulk', () => {
    it('should grant multiple consents in a transaction', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'c1', type: 'PRIVACY_POLICY', granted: true },
        { id: 'c2', type: 'TERMS_OF_SERVICE', granted: true },
      ]);

      const result = await service.grantBulk(
        'user-1',
        [
          { type: 'PRIVACY_POLICY' as never },
          { type: 'TERMS_OF_SERVICE' as never },
        ],
        '127.0.0.1',
      );

      expect(result.consents).toHaveLength(2);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('revokeConsent', () => {
    it('should revoke a granted consent', async () => {
      mockPrisma.consent.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.revokeConsent(
        'user-1',
        { type: 'MARKETING_EMAIL' as never },
        '127.0.0.1',
      );

      expect(result.revoked).toBe(true);
      expect(mockPrisma.consent.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', type: 'MARKETING_EMAIL', granted: true },
        data: expect.objectContaining({
          granted: false,
          revokedAt: expect.any(Date),
        }),
      });
    });

    it('should report false if nothing to revoke', async () => {
      mockPrisma.consent.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.revokeConsent('user-1', {
        type: 'MARKETING_EMAIL' as never,
      });

      expect(result.revoked).toBe(false);
    });
  });

  describe('hasConsent', () => {
    it('should return true when consent is granted', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue({
        granted: true,
      });

      const result = await service.hasConsent('user-1', 'PRIVACY_POLICY');
      expect(result).toBe(true);
    });

    it('should return false when consent is not granted', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue({
        granted: false,
      });

      const result = await service.hasConsent('user-1', 'PRIVACY_POLICY');
      expect(result).toBe(false);
    });

    it('should return false when no consent record exists', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue(null);

      const result = await service.hasConsent('user-1', 'MARKETING_EMAIL');
      expect(result).toBe(false);
    });
  });
});
