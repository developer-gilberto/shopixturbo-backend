import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma.service';
import { ShopsRepository } from './shops.repository';

describe('ShopsRepository', () => {
  let repository: ShopsRepository;
  let prisma: {
    shop: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    marketplaceToken: { upsert: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      shop: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      marketplaceToken: { upsert: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(ShopsRepository);
  });

  describe('createShop', () => {
    it('cria um shop e retorna o resultado', async () => {
      const shop = { id: 'shop-1' };
      prisma.shop.create.mockResolvedValue(shop);
      const data = { name: 'Loja', user_id: 'user-1' } as never;

      await expect(repository.createShop(data)).resolves.toEqual(shop);
      expect(prisma.shop.create).toHaveBeenCalledWith({ data });
    });

    it('lança InternalServerErrorException quando o prisma falha', async () => {
      prisma.shop.create.mockRejectedValue(new Error('db down'));
      const data = { name: 'Loja' } as never;

      await expect(repository.createShop(data)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getShopByIdAndUserId', () => {
    it('busca via findFirst com filtros de id e user_id', async () => {
      prisma.shop.findFirst.mockResolvedValue({ id: 'shop-1' });

      await expect(repository.getShopByIdAndUserId('shop-1', 'user-1')).resolves.toEqual({ id: 'shop-1' });
      expect(prisma.shop.findFirst).toHaveBeenCalledWith({ where: { id: 'shop-1', user_id: 'user-1' } });
    });

    it('lança InternalServerErrorException quando o prisma falha', async () => {
      prisma.shop.findFirst.mockRejectedValue(new Error('db down'));

      await expect(repository.getShopByIdAndUserId('shop-1', 'user-1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getShopByIdWithTokenInclude', () => {
    it('busca via findUnique incluindo marketplace_token', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: 'shop-1' });

      await expect(repository.getShopByIdWithTokenInclude('shop-1')).resolves.toEqual({ id: 'shop-1' });
      expect(prisma.shop.findUnique).toHaveBeenCalledWith({
        where: { id: 'shop-1' },
        include: { marketplace_token: true },
      });
    });

    it('lança InternalServerErrorException quando o prisma falha', async () => {
      prisma.shop.findUnique.mockRejectedValue(new Error('db down'));

      await expect(repository.getShopByIdWithTokenInclude('shop-1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateOrInsertMarketplaceToken', () => {
    it('faz upsert do token do marketplace', async () => {
      prisma.marketplaceToken.upsert.mockResolvedValue({ shop_id: 'shop-1' });
      const data = {
        access_token: 'a',
        refresh_token: 'r',
        external_shop_id: '1001',
        expires_at: new Date(),
      };

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

  describe('updateShop', () => {
    it('atualiza o shop e retorna o resultado', async () => {
      prisma.shop.update.mockResolvedValue({ id: 'shop-1' });
      const data = { name: 'Novo' } as never;

      await expect(repository.updateShop('shop-1', data)).resolves.toEqual({ id: 'shop-1' });
      expect(prisma.shop.update).toHaveBeenCalledWith({ where: { id: 'shop-1' }, data });
    });

    it('lança InternalServerErrorException quando o prisma falha', async () => {
      prisma.shop.update.mockRejectedValue(new Error('db down'));
      const data = { name: 'Novo' } as never;

      await expect(repository.updateShop('shop-1', data)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getShopByUserId', () => {
    it('busca shops não deletados do usuário', async () => {
      prisma.shop.findMany.mockResolvedValue([{ id: 'shop-1' }]);

      await expect(repository.getShopByUserId('user-1')).resolves.toEqual([{ id: 'shop-1' }]);
      expect(prisma.shop.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user-1', deleted_at: null },
        omit: { external_id: true },
      });
    });

    it('lança InternalServerErrorException quando o prisma falha', async () => {
      prisma.shop.findMany.mockRejectedValue(new Error('db down'));

      await expect(repository.getShopByUserId('user-1')).rejects.toThrow(InternalServerErrorException);
    });
  });
});
