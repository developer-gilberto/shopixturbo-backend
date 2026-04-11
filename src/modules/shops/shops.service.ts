import { HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cache } from 'src/configs/cache.config';
import { Env } from 'src/configs/env.schema';
import { RedisService } from 'src/database/redis.service';
import { ShopStatus } from 'src/generated/prisma/enums';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopeeTokenService } from '../integrations/shopee/token/shopee-token.service';
import { ShopsRepository } from './shops.repository';
import { ShopCreate, ShopFull, ShopInfo, ShopProfile } from './shops.type';

@Injectable()
export class ShopsService {
  private readonly logger = new Logger(ShopsService.name);

  private readonly getShopInfoPath: string;
  private readonly getShopProfilePath: string;

  constructor(
    private readonly configService: ConfigService<Env>,
    private readonly shopeeTokenService: ShopeeTokenService,
    private readonly shopeeAuthService: ShopeeAuthService,
    private readonly shopRepository: ShopsRepository,
    private readonly redisService: RedisService,
  ) {
    this.getShopInfoPath = this.configService.getOrThrow<string>('GET_SHOP_INFO_PATH');
    this.getShopProfilePath = this.configService.getOrThrow<string>('GET_SHOP_PROFILE_PATH');
  }

  async getShopInfo(userId: string, shopId: string): Promise<ShopInfo> {
    const cachedTokenAndShopId = await this.shopeeTokenService.getValidAccessToken(userId, shopId);

    const url = this.shopeeAuthService.generateSignedUrl({
      path: this.getShopInfoPath,
      accessToken: cachedTokenAndShopId.access_token,
      shopId: Number(cachedTokenAndShopId.external_shop_id),
    });
    const encodeUrl = encodeURI(url);

    const response = await fetch(encodeUrl);

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao buscar informações da loja: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const data = await response.json();
    return {
      shop_name: data.shop_name,
      region: data.region,
      status: data.status,
      auth_time: data.auth_time,
      expire_time: data.expire_time,
    };
  }

  async getShopProfile(userId: string, shopId: string): Promise<ShopProfile> {
    const cachedTokenAndShopId = await this.shopeeTokenService.getValidAccessToken(userId, shopId);

    const url = this.shopeeAuthService.generateSignedUrl({
      path: this.getShopProfilePath,
      accessToken: cachedTokenAndShopId.access_token,
      shopId: Number(cachedTokenAndShopId.external_shop_id),
    });
    const encodeUrl = encodeURI(url);

    const response = await fetch(encodeUrl);

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao buscar perfil da loja: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const data = await response.json();
    return {
      shop_name: data.response.shop_name,
      description: data.response.description,
      shop_logo: data.response.shop_logo,
      invoice_issuer: data.response.invoice_issuer,
    };
  }

  async getShopFullByIdAndUserId(userId: string, shopId: string) {
    const cacheKey = cache.shopeeShopFullKey(userId, shopId);
    const cachedShop = await this.redisService.get<ShopFull>(cacheKey);
    if (cachedShop) return cachedShop;

    const storedShop = await this.shopRepository.getShopByIdAndUserId(shopId, userId);

    if (!storedShop) throw new NotFoundException('Shop não encontrado');

    const shop: ShopFull = {
      id: storedShop.id,
      shop_name: storedShop.name,
      description: storedShop.description!,
      shop_logo: storedShop.shop_logo!,
      marketplace: storedShop.marketplace,
      authorization_expiration: storedShop.authorization_expiration!,
      authorized_in: storedShop.authorized_in!,
      status: storedShop.status,
      invoice_issuer: storedShop.invoice_issuer!,
      region: storedShop.region!,
    };

    await this.redisService.set(
      cache.shopeeShopFullKey(userId, shop.id),
      shop,
      cache.shopeeShopFullTTL, // 1 hora em segundos
    );

    return shop;
  }

  async getShopByIdAndUserId(shopId: string, userId: string) {
    return await this.shopRepository.getShopByIdAndUserId(shopId, userId);
  }

  async createShop(data: ShopCreate) {
    return await this.shopRepository.createShop(data);
  }

  async updateShop(
    shopId: string,
    data: {
      name: string;
      shop_logo: string;
      description: string;
      authorization_expiration: Date;
      authorized_in: Date;
      status: ShopStatus;
      invoice_issuer: string;
      region: string;
    },
  ) {
    return await this.shopRepository.updateShop(shopId, data);
  }

  async updateOrInsertMarketplaceToken(
    shopId: string,
    data: {
      access_token: string;
      refresh_token: string;
      external_shop_id: string;
      expires_at: Date;
    },
  ) {
    return await this.shopRepository.updateOrInsertMarketplaceToken(shopId, data);
  }

  async getShopByIdWithTokenInclude(shopId: string) {
    return await this.shopRepository.getShopByIdWithTokenInclude(shopId);
  }
}
