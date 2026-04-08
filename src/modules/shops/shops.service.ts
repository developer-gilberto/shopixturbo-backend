import { HttpException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cache } from 'src/configs/cache.config';
import { Env } from 'src/configs/env.schema';
import { RedisService } from 'src/database/redis.service';
import { ShopStatus } from 'src/generated/prisma/enums';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopsRepository } from './shops.repository';
import { ShopCreate, ShopFull, ShopInfo, ShopProfile } from './shops.type';

@Injectable()
export class ShopsService {
  private readonly logger = new Logger(ShopsService.name);

  private readonly getShopInfoPath: string;
  private readonly getShopProfilePath: string;

  constructor(
    private readonly shopeeAuthService: ShopeeAuthService,
    private readonly shopRepository: ShopsRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService<Env>,
  ) {
    this.getShopInfoPath = this.configService.getOrThrow<string>('GET_SHOP_INFO_PATH');
    this.getShopProfilePath = this.configService.getOrThrow<string>('GET_SHOP_PROFILE_PATH');
  }

  async getShopInfo(shop_id: string): Promise<ShopInfo> {
    const accessToken = await this.redisService.get<string>(cache.shopeeAccessTokenKey(shop_id));

    if (!accessToken) {
      throw new UnauthorizedException('Token de acesso expirado ou não encontrado.');
    }

    const url = this.shopeeAuthService.generateSignedUrl({
      path: this.getShopInfoPath,
      accessToken,
      shopId: Number(shop_id),
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
    return data;
  }

  async getShopProfile(shop_id: string): Promise<ShopProfile> {
    const accessToken = await this.redisService.get<string>(cache.shopeeAccessTokenKey(shop_id));

    if (!accessToken) {
      throw new UnauthorizedException('Token de acesso expirado ou não encontrado.');
    }

    const url = this.shopeeAuthService.generateSignedUrl({
      path: this.getShopProfilePath,
      accessToken,
      shopId: Number(shop_id),
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
    return data.response;
  }

  async getShopFullByExternalIdAndUserId(externalId: string, userId: string) {
    const cacheKey = cache.shopeeShopFullKey(externalId);
    const cached = await this.redisService.get<ShopFull>(cacheKey);
    if (cached) return cached;

    const storedShop = await this.shopRepository.getShopByExternalIdAndUserId(externalId, userId);

    if (!storedShop) throw new NotFoundException('Shop não encontrado');

    const shop = {
      id: storedShop.external_id,
      name: storedShop.name,
      description: storedShop.description,
      shop_logo: storedShop.shop_logo,
      marketplace: storedShop.marketplace,
      authorization_expiration: storedShop.authorization_expiration,
      authorized_in: storedShop.authorized_in,
      status: storedShop.status,
      invoice_issuer: storedShop.invoice_issuer,
      region: storedShop.region,
    };

    await this.redisService.set(
      cache.shopeeShopFullKey(shop.id!),
      shop,
      cache.shopeeShopFullTTL, // 1 hora em segundos
    );

    return shop;
  }

  async getShopByExternalIdAndUserId(externalId: string, userId: string) {
    return await this.shopRepository.getShopByExternalIdAndUserId(externalId, userId);
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
      expires_at: Date;
    },
  ) {
    return await this.shopRepository.updateOrInsertMarketplaceToken(shopId, data);
  }
}
