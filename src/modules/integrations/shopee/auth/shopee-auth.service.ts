import * as crypto from 'node:crypto';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/configs/env.schema';
import { ShopeeAccessTokenResponse, SignedUrlData } from './shopee.auth.type';

@Injectable()
export class ShopeeAuthService {
  private readonly logger = new Logger(ShopeeAuthService.name);

  private readonly partnerId: number;
  private readonly partnerKey: string;
  private readonly host: string;
  private readonly authUrlPath: string;
  private readonly redirectUrl: string;
  private readonly getAccessTokenPath: string;
  private readonly getRefreshTokenPath: string;

  constructor(private readonly configService: ConfigService<Env>) {
    this.partnerId = this.configService.getOrThrow<number>('SHOPEE_PARTNER_ID');
    this.partnerKey = this.configService.getOrThrow<string>('SHOPEE_PARTNER_KEY');
    this.host = this.configService.getOrThrow<string>('SHOPEE_AUTH_PARTNER_HOST');
    this.authUrlPath = this.configService.getOrThrow<string>('AUTHORIZATION_URL_PATH');
    this.redirectUrl = this.configService.getOrThrow<string>('REDIRECT_URL');
    this.getAccessTokenPath = this.configService.getOrThrow<string>('GET_ACCESS_TOKEN_PATH');
    this.getRefreshTokenPath = this.configService.getOrThrow<string>('GET_REFRESH_TOKEN_PATH');
  }

  private generateSignature(baseString: string, partnerKey: string) {
    const hmac = crypto.createHmac('sha256', partnerKey);
    hmac.update(baseString);
    return hmac.digest('hex');
  }

  generateSignedUrl(data: SignedUrlData): string {
    const host = this.host;
    const partnerId = this.partnerId;
    const partnerKey = this.partnerKey;
    const timestamp = Math.floor(Date.now() / 1000);

    const hasTokenAndShopId = data.accessToken && data.shopId;

    const stringWithTokenAndShopId = partnerId + data.path + timestamp + data.accessToken + data.shopId;
    const stringWithoutTokenAndShopId = partnerId + data.path + timestamp;

    const baseString = hasTokenAndShopId ? stringWithTokenAndShopId : stringWithoutTokenAndShopId;
    const sign = this.generateSignature(baseString, partnerKey);

    const urlWithTokenAndShopId = `${host}${data.path}?access_token=${data.accessToken}&partner_id=${partnerId}&shop_id=${data.shopId}&sign=${sign}&timestamp=${timestamp}`;
    const urlWithoutTokenAndShopId = `${host}${data.path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;

    return hasTokenAndShopId ? urlWithTokenAndShopId : urlWithoutTokenAndShopId;
  }

  generateAuthorizationUrl() {
    const authUrl = this.generateSignedUrl({ path: this.authUrlPath });
    return `${authUrl}&redirect=${this.redirectUrl}`;
  }

  async exchangeCodeForAccessToken(code: string, shopId: string): Promise<ShopeeAccessTokenResponse> {
    const url = this.generateSignedUrl({ path: this.getAccessTokenPath });
    const encodeUrl = encodeURI(url);

    const response = await fetch(encodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code, // válido por 10 minutos
        shop_id: Number(shopId),
        partner_id: Number(this.partnerId),
      }),
    });

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao trocar código por accessToken: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const data = await response.json();
    return data;
  }

  async getAccessToken(shopId: string, refreshToken: string): Promise<ShopeeAccessTokenResponse> {
    const url = this.generateSignedUrl({ path: this.getRefreshTokenPath });
    const encodeUrl = encodeURI(url);

    const response = await fetch(encodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: Number(shopId),
        refresh_token: refreshToken, // valido por 30 dias
        partner_id: Number(this.partnerId),
      }),
    });

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao obter accessToken permanente: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const data = await response.json();
    return data;
  }
}
