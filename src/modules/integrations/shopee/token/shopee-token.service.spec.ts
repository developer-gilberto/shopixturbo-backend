import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { RedisService } from 'src/database/redis.service';
import { ShopeeAuthService } from '../auth/shopee-auth.service';
import { ShopeeTokenRepository } from './shopee-token.repository';
import { ShopeeTokenService } from './shopee-token.service';

describe('ShopeeTokenService', () => {
  let service: ShopeeTokenService;
  let redisService: jest.Mocked<RedisService>;
  let tokenRepository: jest.Mocked<ShopeeTokenRepository>;
  let authService: jest.Mocked<ShopeeAuthService>;
  let encryptionService: jest.Mocked<EncryptionService>;

  const tokenCacheKey = 'shopee:access_token:user-1:shop-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopeeTokenService,
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: ShopeeTokenRepository,
          useValue: {
            getTokenByshopIdWithShopInclude: jest.fn(),
            updateOrInsertMarketplaceToken: jest.fn(),
          },
        },
        {
          provide: ShopeeAuthService,
          useValue: {
            getAccessToken: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((v: string) => `enc:${v}`),
            decrypt: jest.fn((v: string) => v.replace('enc:', '')),
          },
        },
      ],
    }).compile();

    service = module.get(ShopeeTokenService);
    redisService = module.get(RedisService);
    tokenRepository = module.get(ShopeeTokenRepository);
    authService = module.get(ShopeeAuthService);
    encryptionService = module.get(EncryptionService);
  });

  describe('isTokenExpired', () => {
    it('considera token expirado quando a data é null', () => {
      expect(service.isTokenExpired(null)).toBe(true);
    });

    it('considera token válido quando a expiração é futura', () => {
      const future = new Date(Date.now() + 60_000);
      expect(service.isTokenExpired(future)).toBe(false);
    });

    it('considera token expirado quando a expiração é passada ou igual a agora', () => {
      const past = new Date(Date.now() - 60_000);
      const now = new Date();
      expect(service.isTokenExpired(past)).toBe(true);
      expect(service.isTokenExpired(now)).toBe(true);
    });
  });

  describe('getValidAccessToken', () => {
    it('retorna o token em cache quando existe', async () => {
      redisService.get.mockResolvedValue({ access_token: 'cached', external_shop_id: '1001' } as never);

      const result = await service.getValidAccessToken('user-1', 'shop-1');

      expect(result).toEqual({ access_token: 'cached', external_shop_id: '1001' });
      expect(tokenRepository.getTokenByshopIdWithShopInclude).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando não há token armazenado', async () => {
      redisService.get.mockResolvedValue(null);
      tokenRepository.getTokenByshopIdWithShopInclude.mockResolvedValue(null);

      await expect(service.getValidAccessToken('user-1', 'shop-1')).rejects.toThrow(
        new NotFoundException('Token não encontrado ou não pertence ao usuário logado.'),
      );
    });

    it('lança NotFoundException quando o userId não pertence à loja', async () => {
      redisService.get.mockResolvedValue(null);
      tokenRepository.getTokenByshopIdWithShopInclude.mockResolvedValue({
        refresh_token: 'enc:r',
        expires_at: new Date(Date.now() + 60_000),
        external_shop_id: '1001',
        shop: { user_id: 'outro-usuario' },
      } as never);

      await expect(service.getValidAccessToken('user-1', 'shop-1')).rejects.toThrow(NotFoundException);
    });

    it('solicita novo token quando o atual está expirado, atualiza repositório e cacheia', async () => {
      redisService.get.mockResolvedValue(null);
      tokenRepository.getTokenByshopIdWithShopInclude.mockResolvedValue({
        refresh_token: 'enc:refresh-1',
        expires_at: new Date(Date.now() - 60_000),
        external_shop_id: '1001',
        shop: { user_id: 'user-1' },
      } as never);
      authService.getAccessToken.mockResolvedValue({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expire_in: 14400,
      } as never);

      const result = await service.getValidAccessToken('user-1', 'shop-1');

      expect(encryptionService.decrypt).toHaveBeenCalledWith('enc:refresh-1');
      expect(tokenRepository.updateOrInsertMarketplaceToken).toHaveBeenCalledWith(
        'shop-1',
        expect.objectContaining({ access_token: 'enc:new-token', refresh_token: 'enc:new-refresh' }),
      );
      expect(redisService.set).toHaveBeenCalledWith(
        tokenCacheKey,
        expect.objectContaining({ access_token: 'new-token' }),
        expect.any(Number),
      );
      expect(result).toEqual({ internal_shop_id: 'shop-1', access_token: 'new-token', external_shop_id: '1001' });
    });

    it('descriptografa e cacheia o token válido armazenado', async () => {
      redisService.get.mockResolvedValue(null);
      tokenRepository.getTokenByshopIdWithShopInclude.mockResolvedValue({
        refresh_token: 'enc:refresh-1',
        access_token: 'enc:stored-token',
        expires_at: new Date(Date.now() + 60_000),
        external_shop_id: '1001',
        shop: { user_id: 'user-1' },
      } as never);

      const result = await service.getValidAccessToken('user-1', 'shop-1');

      expect(encryptionService.decrypt).toHaveBeenCalledWith('enc:stored-token');
      expect(redisService.set).toHaveBeenCalledWith(
        tokenCacheKey,
        expect.objectContaining({ access_token: 'stored-token' }),
        expect.any(Number),
      );
      expect(result).toEqual({ access_token: 'stored-token', external_shop_id: '1001' });
    });
  });
});
