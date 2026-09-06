import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from 'src/database/redis.service';
import { MarketplaceType, ShopStatus } from 'src/generated/prisma/enums';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopeeTokenService } from '../integrations/shopee/token/shopee-token.service';
import { ShopsRepository } from './shops.repository';
import { ShopsService } from './shops.service';

describe('ShopsService', () => {
  let service: ShopsService;
  let shopRepository: jest.Mocked<ShopsRepository>;
  let redisService: jest.Mocked<RedisService>;
  let shopeeTokenService: jest.Mocked<ShopeeTokenService>;
  let shopeeAuthService: jest.Mocked<ShopeeAuthService>;

  const tokenAndShopId = { access_token: 'token', external_shop_id: '1001' };

  const storedShop = {
    id: 'shop-1',
    name: 'Minha Loja',
    description: 'desc',
    shop_logo: 'logo',
    marketplace: MarketplaceType.SHOPEE,
    external_id: '1001',
    authorization_expiration: new Date('2026-01-01'),
    authorized_in: new Date('2025-01-01'),
    status: ShopStatus.NORMAL,
    invoice_issuer: 'issuer',
    region: 'BR',
    user_id: 'user-1',
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFetchOk = (payload: unknown) =>
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => payload } as Response);

  const mockFetchFail = (status: number, statusText: string) =>
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status, statusText } as Response);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopsService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('/api/path') },
        },
        {
          provide: ShopeeTokenService,
          useValue: { getValidAccessToken: jest.fn() },
        },
        {
          provide: ShopeeAuthService,
          useValue: { generateSignedUrl: jest.fn().mockReturnValue('https://partner.example.com/path') },
        },
        {
          provide: ShopsRepository,
          useValue: {
            getShopByIdAndUserId: jest.fn(),
            createShop: jest.fn(),
            updateShop: jest.fn(),
            updateOrInsertMarketplaceToken: jest.fn(),
            getShopByIdWithTokenInclude: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ShopsService);
    shopRepository = module.get(ShopsRepository);
    redisService = module.get(RedisService);
    shopeeTokenService = module.get(ShopeeTokenService);
    shopeeAuthService = module.get(ShopeeAuthService);
    shopeeTokenService.getValidAccessToken.mockResolvedValue(tokenAndShopId);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getShopInfo', () => {
    it('retorna informações da loja a partir da API Shopee', async () => {
      mockFetchOk({
        shop_name: 'Minha Loja',
        region: 'BR',
        status: 'NORMAL',
        auth_time: 1700000000,
        expire_time: 1700003600,
      });

      const result = await service.getShopInfo('user-1', 'shop-1');

      expect(shopeeAuthService.generateSignedUrl).toHaveBeenCalled();
      expect(result).toEqual({
        shop_name: 'Minha Loja',
        region: 'BR',
        status: 'NORMAL',
        auth_time: 1700000000,
        expire_time: 1700003600,
      });
    });

    it('lança HttpException quando a API Shopee retorna erro', async () => {
      mockFetchFail(500, 'Internal Server Error');

      await expect(service.getShopInfo('user-1', 'shop-1')).rejects.toThrow(expect.objectContaining({ status: 500 }));
    });
  });

  describe('getShopProfile', () => {
    it('retorna o perfil da loja extraindo de data.response', async () => {
      mockFetchOk({
        response: {
          shop_name: 'Minha Loja',
          description: 'desc',
          shop_logo: 'logo',
          invoice_issuer: 'issuer',
        },
      });

      const result = await service.getShopProfile('user-1', 'shop-1');

      expect(result).toEqual({
        shop_name: 'Minha Loja',
        description: 'desc',
        shop_logo: 'logo',
        invoice_issuer: 'issuer',
      });
    });

    it('lança HttpException quando a API Shopee retorna erro', async () => {
      mockFetchFail(400, 'Bad Request');

      await expect(service.getShopProfile('user-1', 'shop-1')).rejects.toThrow(
        expect.objectContaining({ status: 400 }),
      );
    });
  });

  describe('getShopFullByIdAndUserId', () => {
    it('retorna dados em cache quando existem', async () => {
      const cached = { id: 'shop-1', shop_name: 'cache' } as never;
      redisService.get.mockResolvedValue(cached);

      const result = await service.getShopFullByIdAndUserId('user-1', 'shop-1');

      expect(result).toEqual(cached);
      expect(shopRepository.getShopByIdAndUserId).not.toHaveBeenCalled();
    });

    it('busca do repositório e popula cache quando não há dados em cache', async () => {
      redisService.get.mockResolvedValue(null);
      shopRepository.getShopByIdAndUserId.mockResolvedValue(storedShop as never);

      const result = await service.getShopFullByIdAndUserId('user-1', 'shop-1');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'shop-1',
          shop_name: 'Minha Loja',
          marketplace: MarketplaceType.SHOPEE,
          status: ShopStatus.NORMAL,
        }),
      );
      expect(redisService.set).toHaveBeenCalled();
    });

    it('lança NotFoundException quando a loja não existe no repositório', async () => {
      redisService.get.mockResolvedValue(null);
      shopRepository.getShopByIdAndUserId.mockResolvedValue(null);

      await expect(service.getShopFullByIdAndUserId('user-1', 'shop-1')).rejects.toThrow(
        new NotFoundException('Shop não encontrado'),
      );
    });
  });

  describe('delegação para o repositório', () => {
    it('getShopByIdAndUserId delega ao repositório', async () => {
      shopRepository.getShopByIdAndUserId.mockResolvedValue(storedShop as never);

      const result = await service.getShopByIdAndUserId('shop-1', 'user-1');

      expect(shopRepository.getShopByIdAndUserId).toHaveBeenCalledWith('shop-1', 'user-1');
      expect(result).toBe(storedShop);
    });

    it('createShop delega ao repositório', async () => {
      const data = { name: 'Loja' } as never;
      shopRepository.createShop.mockResolvedValue(storedShop as never);

      const result = await service.createShop(data);

      expect(shopRepository.createShop).toHaveBeenCalledWith(data);
      expect(result).toBe(storedShop);
    });

    it('updateShop delega ao repositório', async () => {
      const data = { name: 'Loja' } as never;
      shopRepository.updateShop.mockResolvedValue(storedShop as never);

      const result = await service.updateShop('shop-1', data);

      expect(shopRepository.updateShop).toHaveBeenCalledWith('shop-1', data);
      expect(result).toBe(storedShop);
    });

    it('updateOrInsertMarketplaceToken delega ao repositório', async () => {
      const data = { access_token: 'a' } as never;
      shopRepository.updateOrInsertMarketplaceToken.mockResolvedValue({} as never);

      await service.updateOrInsertMarketplaceToken('shop-1', data);

      expect(shopRepository.updateOrInsertMarketplaceToken).toHaveBeenCalledWith('shop-1', data);
    });

    it('getShopByIdWithTokenInclude delega ao repositório', async () => {
      const expected = { id: 'shop-1' } as never;
      shopRepository.getShopByIdWithTokenInclude.mockResolvedValue(expected);

      const result = await service.getShopByIdWithTokenInclude('shop-1');

      expect(shopRepository.getShopByIdWithTokenInclude).toHaveBeenCalledWith('shop-1');
      expect(result).toBe(expected);
    });
  });
});
