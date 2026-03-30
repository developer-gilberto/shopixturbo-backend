import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { cache } from 'src/configs/cache.config';
import { RedisService } from 'src/database/redis.service';
import { MarketplaceType } from 'src/generated/prisma/enums';
import { ShopsService } from 'src/modules/shops/shops.service';
import { ShopeeAuthService } from './auth/shopee-auth.service';
import { CallbackGetTokenDTO } from './shopee.dto';

@Injectable()
export class ShopeeService {
  private readonly logger = new Logger(ShopeeService.name);

  constructor(
    private readonly shopeeAuthService: ShopeeAuthService,
    private readonly shopService: ShopsService,
    private readonly encryptionService: EncryptionService,
    private readonly redisService: RedisService,
  ) {}

  getAuthUrl(): string {
    return this.shopeeAuthService.generateAuthorizationUrl();
  }

  async handleCallback(userId: string, data: CallbackGetTokenDTO) {
    const temporaryTokens = await this.shopeeAuthService.exchangeCodeForAccessToken(data.code, data.shop_id);
    const permanentTokens = await this.shopeeAuthService.getAccessToken(data.shop_id, temporaryTokens.refresh_token);

    const [fetchShopInfo, fetchShopProfile] = await Promise.allSettled([
      this.shopService.getShopInfo(data.shop_id, permanentTokens.access_token),
      this.shopService.getShopProfile(data.shop_id, permanentTokens.access_token),
    ]);

    if (fetchShopInfo.status === 'rejected') {
      this.logger.error('API Shopee: falha ao buscar informações da loja: \n', fetchShopInfo.reason);
      throw new HttpException('API Shopee: ', HttpStatus.BAD_GATEWAY, {
        cause: new Error(fetchShopInfo.reason),
      });
    }

    if (fetchShopProfile.status === 'rejected') {
      this.logger.error('API Shopee: falha ao buscar perfil da loja: \n', fetchShopProfile.reason);
      throw new HttpException('API Shopee: ', HttpStatus.BAD_GATEWAY, {
        cause: new Error(fetchShopProfile.reason),
      });
    }

    const shopInfo = fetchShopInfo.value;
    const shopProfile = fetchShopProfile.value;

    let shop = await this.shopService.getShopByExternalIdAndUserId(data.shop_id, userId);

    if (!shop) {
      shop = await this.shopService.createShop({
        name: shopInfo.shop_name,
        description: shopProfile.description,
        shop_logo: shopProfile.shop_logo,
        marketplace: MarketplaceType.SHOPEE,
        authorization_expiration: new Date(shopInfo.expire_time * 1000),
        external_id: data.shop_id,
        user_id: userId,
      });
    } else {
      await this.shopService.updateShop(shop.id, {
        name: shopInfo.shop_name,
        description: shopProfile.description,
        shop_logo: shopProfile.shop_logo,
        authorization_expiration: new Date(shopInfo.expire_time * 1000),
      });
    }

    const encryptedAccessToken = this.encryptionService.encrypt(permanentTokens.access_token);
    const encryptedRefreshToken = this.encryptionService.encrypt(permanentTokens.refresh_token);
    const expiresAt = new Date(Date.now() + permanentTokens.expire_in * 1000);

    await this.shopService.updateOrInsertMarketplaceToken(shop.id, {
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt, // data e hora exatas da expiração do access_token(válido por 4 horas)
    });

    await this.redisService.set(
      cache.shopeeAccessTokenKey(data.shop_id),
      permanentTokens.access_token,
      cache.shopeeAccessTokenTTL, // 3 horas em segundos
    );

    const shopData = {
      id: shop.id,
      name: shopProfile.shop_name,
      description: shopProfile.description,
      shop_logo: shopProfile.shop_logo,
      marketplace: shop.marketplace,
      authorization_expiration: new Date(shopInfo.expire_time * 1000),
      status: shopInfo.status,
      invoice_issuer: shopProfile.invoice_issuer,
    };

    return {
      message: 'Loja conectada com sucesso',
      shop: shopData,
    };
  }
}
