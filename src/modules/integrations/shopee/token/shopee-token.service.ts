import { Injectable, NotFoundException } from '@nestjs/common';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { cache } from 'src/configs/cache.config';
import { RedisService } from 'src/database/redis.service';
import { ShopeeAuthService } from '../auth/shopee-auth.service';
import { ShopeeTokenRepository } from './shopee-token.repository';
import { ShopeeTokenCached } from './shopee-token.type';

@Injectable()
export class ShopeeTokenService {
  constructor(
    private readonly redisService: RedisService,
    private readonly shopeeTokenRepository: ShopeeTokenRepository,
    private readonly shopeeAuthService: ShopeeAuthService,
    private readonly encryptionService: EncryptionService,
  ) {}

  isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) {
      return true; // Sem data de expiração é considerado expirado
    }
    const now = new Date();
    return expiresAt.getTime() <= now.getTime();
  }

  async requestNewAccessToken(internalShopId: string, externalShopId: string, encryptedRefreshToken: string) {
    const refreshToken = this.encryptionService.decrypt(encryptedRefreshToken);
    const newToken = await this.shopeeAuthService.getAccessToken(externalShopId, refreshToken);

    await this.shopeeTokenRepository.updateOrInsertMarketplaceToken(internalShopId, {
      access_token: this.encryptionService.encrypt(newToken.access_token),
      refresh_token: this.encryptionService.encrypt(newToken.refresh_token),
      external_shop_id: externalShopId,
      expires_at: new Date(Date.now() + newToken.expire_in * 1000), // data e hora exatas da expiração(válido por 4 horas)
    });

    return {
      internal_shop_id: internalShopId,
      external_shop_id: externalShopId,
      access_token: newToken.access_token,
    };
  }

  async getValidAccessToken(
    userId: string,
    internalShopId: string,
  ): Promise<{ access_token: string; external_shop_id: string }> {
    const cacheKey = cache.shopeeAccessTokenKey(userId, internalShopId);
    const cachedToken = await this.redisService.get<ShopeeTokenCached>(cacheKey);

    if (cachedToken) {
      return { access_token: cachedToken.access_token, external_shop_id: cachedToken.external_shop_id };
    }

    const storedToken = await this.shopeeTokenRepository.getTokenByshopIdWithShopInclude(internalShopId);

    if (!storedToken || !storedToken.refresh_token || userId !== storedToken.shop.user_id) {
      throw new NotFoundException(`Token não encontrado ou não pertence ao usuário logado.`);
    }

    const expiredToken = this.isTokenExpired(storedToken.expires_at);

    if (expiredToken) {
      const newToken: ShopeeTokenCached = await this.requestNewAccessToken(
        internalShopId,
        storedToken.external_shop_id,
        storedToken.refresh_token,
      );

      await this.redisService.set(cacheKey, newToken, cache.shopeeAccessTokenTTL);

      return newToken;
    }

    const accessToken = this.encryptionService.decrypt(storedToken.access_token);

    const tokenData: ShopeeTokenCached = {
      internal_shop_id: internalShopId,
      external_shop_id: storedToken.external_shop_id,
      access_token: accessToken,
    };

    await this.redisService.set(cacheKey, tokenData, cache.shopeeAccessTokenTTL);

    return { access_token: accessToken, external_shop_id: storedToken.external_shop_id };
  }
}
