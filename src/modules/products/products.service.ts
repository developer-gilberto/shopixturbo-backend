import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/configs/env.schema';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopeeTokenService } from '../integrations/shopee/token/shopee-token.service';
import { GetProductList } from './products.type';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  private readonly getProductListPath: string;

  constructor(
    private readonly configService: ConfigService<Env>,
    private readonly shopeeTokenService: ShopeeTokenService,
    private readonly shopeeAuthService: ShopeeAuthService,
  ) {
    this.getProductListPath = this.configService.getOrThrow<string>('GET_ITEM_LIST_PATH');
  }

  async getProductsList(data: GetProductList) {
    const cachedTokenAndShopId = await this.shopeeTokenService.getValidAccessToken(data.userId, data.shopId);

    const signedUrl = this.shopeeAuthService.generateSignedUrl({
      path: this.getProductListPath,
      accessToken: cachedTokenAndShopId.access_token,
      shopId: Number(cachedTokenAndShopId.external_shop_id),
    });

    const encodeUrl = encodeURI(
      `${signedUrl}&offset=${data.offset}&page_size=${data.page_size}&item_status=${data.item_status}&update_time_from=${data.update_time_from}&update_time_to=${data.update_time_to}`,
    );

    const response = await fetch(encodeUrl);

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao buscar lista de produtos: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const productsList = await response.json();

    return productsList.response;
  }
}
