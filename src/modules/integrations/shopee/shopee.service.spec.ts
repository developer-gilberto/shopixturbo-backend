import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { RedisService } from 'src/database/redis.service';
import { ShopStatus } from 'src/generated/prisma/enums';
import { ProductsSyncProducer } from 'src/modules/products-sync/products-sync.producer';
import { ProductsSyncService } from 'src/modules/products-sync/products-sync.service';
import { ShopsService } from 'src/modules/shops/shops.service';
import { ShopeeAuthService } from './auth/shopee-auth.service';
import { ShopeeService } from './shopee.service';

describe('ShopeeService', () => {
  let service: ShopeeService;
  let shopeeAuthService: jest.Mocked<ShopeeAuthService>;
  let encryptionService: jest.Mocked<EncryptionService>;
  let redisService: jest.Mocked<RedisService>;
  let shopService: jest.Mocked<ShopsService>;
  let productSyncService: jest.Mocked<ProductsSyncService>;
  let productSyncProducer: jest.Mocked<ProductsSyncProducer>;

  const configValues: Record<string, string> = {
    GET_SHOP_INFO_PATH: '/api/v2/shop/get_shop_info',
    GET_SHOP_PROFILE_PATH: '/api/v2/shop/get_shop_profile',
  };

  const mockFetchOk = (payload: unknown) =>
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => payload } as Response);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopeeService,
        { provide: ConfigService, useValue: { getOrThrow: jest.fn((k: string) => configValues[k]) } },
        {
          provide: ShopeeAuthService,
          useValue: {
            generateAuthorizationUrl: jest.fn().mockReturnValue('https://auth.example.com'),
            exchangeCodeForAccessToken: jest.fn(),
            getAccessToken: jest.fn(),
            generateSignedUrl: jest.fn().mockReturnValue('https://partner.shopeemobile.com/path'),
          },
        },
        {
          provide: EncryptionService,
          useValue: { encrypt: jest.fn((v: string) => `enc:${v}`), decrypt: jest.fn((v: string) => v) },
        },
        { provide: RedisService, useValue: { set: jest.fn(), get: jest.fn() } },
        {
          provide: ShopsService,
          useValue: {
            getShopByIdAndUserId: jest.fn(),
            createShop: jest.fn(),
            updateShop: jest.fn(),
            updateOrInsertMarketplaceToken: jest.fn(),
          },
        },
        { provide: ProductsSyncService, useValue: { createInitialRecord: jest.fn() } },
        { provide: ProductsSyncProducer, useValue: { syncProducts: jest.fn() } },
      ],
    }).compile();

    service = module.get(ShopeeService);
    shopeeAuthService = module.get(ShopeeAuthService);
    encryptionService = module.get(EncryptionService);
    redisService = module.get(RedisService);
    shopService = module.get(ShopsService);
    productSyncService = module.get(ProductsSyncService);
    productSyncProducer = module.get(ProductsSyncProducer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAuthUrl', () => {
    it('retorna a url de autorização do serviço de auth', () => {
      expect(service.getAuthUrl()).toBe('https://auth.example.com');
    });
  });

  describe('handleCallback', () => {
    const callbackData = { code: 'code-1', shop_id: '55' };

    beforeEach(() => {
      shopeeAuthService.exchangeCodeForAccessToken.mockResolvedValue({
        access_token: 'temp',
        refresh_token: 'refresh-1',
        expire_in: 600,
      } as never);
      shopeeAuthService.getAccessToken.mockResolvedValue({
        access_token: 'perm',
        refresh_token: 'refresh-perm',
        expire_in: 14400,
      } as never);
    });

    it('cria uma nova loja e conecta com sucesso', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            shop_name: 'Minha Loja',
            region: 'BR',
            status: ShopStatus.NORMAL,
            auth_time: 1700000000,
            expire_time: 1700003600,
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: {
              shop_name: 'Minha Loja',
              description: 'desc',
              shop_logo: 'logo',
              invoice_issuer: 'issuer',
            },
          }),
        } as Response);
      shopService.getShopByIdAndUserId.mockResolvedValue(null);
      shopService.createShop.mockResolvedValue({
        id: 'shop-1',
        external_id: '55',
      } as never);

      const result = await service.handleCallback('user-1', callbackData);

      expect(shopService.getShopByIdAndUserId).toHaveBeenCalledWith('55', 'user-1');
      expect(shopService.createShop).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Minha Loja', user_id: 'user-1' }),
      );
      expect(encryptionService.encrypt).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
      expect(productSyncService.createInitialRecord).toHaveBeenCalled();
      expect(productSyncProducer.syncProducts).toHaveBeenCalledWith('user-1', 'shop-1');
      expect(result).toEqual(expect.objectContaining({ message: 'Loja conectada com sucesso' }));
    });

    it('atualiza a loja quando ela já existe', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            shop_name: 'Minha Loja',
            region: 'BR',
            status: ShopStatus.NORMAL,
            auth_time: 1700000000,
            expire_time: 1700003600,
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: {
              shop_name: 'Minha Loja',
              description: 'desc',
              shop_logo: 'logo',
              invoice_issuer: 'issuer',
            },
          }),
        } as Response);
      shopService.getShopByIdAndUserId.mockResolvedValue({ id: 'shop-1', external_id: '55' } as never);

      await service.handleCallback('user-1', callbackData);

      expect(shopService.createShop).not.toHaveBeenCalled();
      expect(shopService.updateShop).toHaveBeenCalledWith('shop-1', expect.any(Object));
    });

    it('lança Bad Gateway quando falha ao buscar informações da loja', async () => {
      shopeeAuthService.generateSignedUrl.mockReturnValue('https://partner.shopeemobile.com/path');
      jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500, statusText: 'Erro' } as Response);

      await expect(service.handleCallback('user-1', callbackData)).rejects.toThrow(
        expect.objectContaining({ status: 502 }),
      );
    });
  });

  describe('fetchShop', () => {
    it('retorna payload direto para o path de informações da loja', async () => {
      mockFetchOk({ shop_name: 'Loja' });

      const result = await service.fetchShop<{ shop_name: string }>('55', 'tok', configValues.GET_SHOP_INFO_PATH);

      expect(result).toEqual({ shop_name: 'Loja' });
    });

    it('retorna data.response para o path de perfil da loja', async () => {
      mockFetchOk({ response: { shop_name: 'Loja' } });

      const result = await service.fetchShop<{ shop_name: string }>('55', 'tok', configValues.GET_SHOP_PROFILE_PATH);

      expect(result).toEqual({ shop_name: 'Loja' });
    });

    it('lança HttpException quando a API retorna erro', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 400, statusText: 'Bad' } as Response);

      await expect(service.fetchShop('55', 'tok', '/path')).rejects.toThrow(expect.objectContaining({ status: 400 }));
    });
  });
});
