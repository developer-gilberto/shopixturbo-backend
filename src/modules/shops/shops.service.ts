import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopsRepository } from './shops.repository';
import { ShopCreate, ShopInfo, ShopProfile } from './shops.type';

@Injectable()
export class ShopsService {
  private readonly logger = new Logger(ShopsService.name);

  private readonly getShopInfoPath: string;
  private readonly getShopProfilePath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly shopeeAuthService: ShopeeAuthService,
    private readonly shopRepository: ShopsRepository,
  ) {
    this.getShopInfoPath = this.configService.getOrThrow<string>('GET_SHOP_INFO_PATH');
    this.getShopProfilePath = this.configService.getOrThrow<string>('GET_SHOP_PROFILE_PATH');
  }

  async getShopInfo(shop_id: string, accessToken: string): Promise<ShopInfo> {
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

  async getShopProfile(shop_id: string, accessToken: string): Promise<ShopProfile> {
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
