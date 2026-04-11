import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from 'src/common/encryption/encryption.service';
import { cache } from 'src/configs/cache.config';
import { Env } from 'src/configs/env.schema';
import { RedisService } from 'src/database/redis.service';
import { MarketplaceType } from 'src/generated/prisma/enums';
import { ShopsService } from 'src/modules/shops/shops.service';
import { ShopFull, ShopInfo, ShopProfile } from 'src/modules/shops/shops.type';
import { ShopeeAuthService } from './auth/shopee-auth.service';
import { CallbackGetTokenDTO } from './shopee.dto';
import { ShopeeTokenCached } from './token/shopee-token.type';

@Injectable()
export class ShopeeService {
  private readonly logger = new Logger(ShopeeService.name);

  private readonly getShopInfoPath: string;
  private readonly getShopProfilePath: string;

  constructor(
    private readonly configService: ConfigService<Env>,
    private readonly shopeeAuthService: ShopeeAuthService,
    private readonly shopService: ShopsService,
    private readonly encryptionService: EncryptionService,
    private readonly redisService: RedisService,
  ) {
    this.getShopInfoPath = this.configService.getOrThrow<string>('GET_SHOP_INFO_PATH');
    this.getShopProfilePath = this.configService.getOrThrow<string>('GET_SHOP_PROFILE_PATH');
  }

  getAuthUrl(): string {
    return this.shopeeAuthService.generateAuthorizationUrl();
  }

  async handleCallback(userId: string, data: CallbackGetTokenDTO) {
    const temporaryTokens = await this.shopeeAuthService.exchangeCodeForAccessToken(data.code, data.shop_id);
    const permanentTokens = await this.shopeeAuthService.getAccessToken(data.shop_id, temporaryTokens.refresh_token);

    const [fetchShopInfo, fetchShopProfile] = await Promise.allSettled([
      this.fetchShop<ShopInfo>(data.shop_id, permanentTokens.access_token, this.getShopInfoPath),
      this.fetchShop<ShopProfile>(data.shop_id, permanentTokens.access_token, this.getShopProfilePath),
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

    let shop = await this.shopService.getShopByIdAndUserId(data.shop_id, userId);

    if (!shop) {
      shop = await this.shopService.createShop({
        name: shopInfo.shop_name,
        description: shopProfile.description,
        shop_logo: shopProfile.shop_logo,
        marketplace: MarketplaceType.SHOPEE,
        authorization_expiration: new Date(shopInfo.expire_time * 1000),
        authorized_in: new Date(shopInfo.auth_time * 1000),
        status: shopInfo.status,
        invoice_issuer: shopProfile.invoice_issuer,
        region: shopInfo.region,
        external_id: data.shop_id,
        user_id: userId,
      });
    } else {
      await this.shopService.updateShop(shop.id, {
        name: shopInfo.shop_name,
        description: shopProfile.description,
        shop_logo: shopProfile.shop_logo,
        authorization_expiration: new Date(shopInfo.expire_time * 1000),
        authorized_in: new Date(shopInfo.auth_time * 1000),
        status: shopInfo.status,
        invoice_issuer: shopProfile.invoice_issuer,
        region: shopInfo.region,
      });
    }

    await this.shopService.updateOrInsertMarketplaceToken(shop.id, {
      access_token: this.encryptionService.encrypt(permanentTokens.access_token),
      refresh_token: this.encryptionService.encrypt(permanentTokens.refresh_token),
      external_shop_id: shop.external_id!,
      expires_at: new Date(Date.now() + permanentTokens.expire_in * 1000), // data e hora da expiração(válido por 4 horas)
    });

    const tokenData: ShopeeTokenCached = {
      internal_shop_id: shop.id,
      external_shop_id: shop.external_id!,
      access_token: permanentTokens.access_token,
    };

    await this.redisService.set(
      cache.shopeeAccessTokenKey(userId, shop.id),
      tokenData,
      cache.shopeeAccessTokenTTL, // 3 horas em segundos
    );

    const shopData: ShopFull = {
      id: shop.id,
      shop_name: shopInfo.shop_name,
      description: shopProfile.description,
      shop_logo: shopProfile.shop_logo,
      marketplace: MarketplaceType.SHOPEE,
      authorization_expiration: new Date(shopInfo.expire_time * 1000),
      authorized_in: new Date(shopInfo.auth_time * 1000),
      status: shopInfo.status,
      invoice_issuer: shopProfile.invoice_issuer,
      region: shopInfo.region,
    };

    await this.redisService.set(
      cache.shopeeShopFullKey(userId, shop.id),
      shopData,
      cache.shopeeShopFullTTL, // 1 hora em segundos
    );

    return {
      message: 'Loja conectada com sucesso',
      shop: shopData,
    };
  }

  async fetchShop<T>(shop_id: string, accessToken: string, path: string): Promise<T> {
    const url = this.shopeeAuthService.generateSignedUrl({
      path,
      accessToken,
      shopId: Number(shop_id),
    });
    const encodeUrl = encodeURI(url);

    const response = await fetch(encodeUrl);

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao buscar dados do shop: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const data = await response.json();
    return path === this.getShopInfoPath ? data : data.response;
  }
}
