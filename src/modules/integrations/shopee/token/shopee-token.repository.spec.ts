import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma.service';
import { ShopeeTokenRepository } from './shopee-token.repository';

describe('ShopeeTokenRepository', () => {
  let repository: ShopeeTokenRepository;
  let prisma: { marketplaceToken: { findUnique: jest.Mock; upsert: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      marketplaceToken: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopeeTokenRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(ShopeeTokenRepository);
  });

  describe('getTokenByshopIdWithShopInclude', () => {
    it('busca o token incluindo a loja', async () => {
      prisma.marketplaceToken.findUnique.mockResolvedValue({ shop_id: 'shop-1' });

      await expect(repository.getTokenByshopIdWithShopInclude('shop-1')).resolves.toEqual({ shop_id: 'shop-1' });
      expect(prisma.marketplaceToken.findUnique).toHaveBeenCalledWith({
        where: { shop_id: 'shop-1' },
        include: { shop: true },
      });
    });

    it('lança InternalServerErrorException quando o prisma falha', async () => {
      prisma.marketplaceToken.findUnique.mockRejectedValue(new Error('db down'));

      await expect(repository.getTokenByshopIdWithShopInclude('shop-1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateOrInsertMarketplaceToken', () => {
    it('faz upsert do token', async () => {
      prisma.marketplaceToken.upsert.mockResolvedValue({ shop_id: 'shop-1' });
      const data = { access_token: 'a', refresh_token: 'r', external_shop_id: '1001', expires_at: new Date() };

      await expect(repository.updateOrInsertMarketplaceToken('shop-1', data)).resolves.toEqual({ shop_id: 'shop-1' });
      expect(prisma.marketplaceToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { shop_id: 'shop-1' } }),
      );
    });

    it('lança InternalServerErrorException quando o prisma falha', async () => {
      prisma.marketplaceToken.upsert.mockRejectedValue(new Error('db down'));
      const data = { access_token: 'a' } as never;

      await expect(repository.updateOrInsertMarketplaceToken('shop-1', data)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
