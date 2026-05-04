import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { constants } from 'src/configs/constants.config';
import { Env } from 'src/configs/env.schema';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopeeTokenService } from '../integrations/shopee/token/shopee-token.service';
import { GetProductFullDTO, ProductsUpdateCostAndTaxesDTO } from './products.dto';
import { ProductsRepository } from './products.repository';
import { CreateProductInput, GetProductList, GetProductsInfo } from './products.type';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  private readonly getProductListPath: string;
  private readonly getProductInfoPath: string;

  constructor(
    private readonly configService: ConfigService<Env>,
    private readonly shopeeTokenService: ShopeeTokenService,
    private readonly shopeeAuthService: ShopeeAuthService,
    private readonly productsRepo: ProductsRepository,
  ) {
    this.getProductListPath = this.configService.getOrThrow<string>('GET_ITEM_LIST_PATH');
    this.getProductInfoPath = this.configService.getOrThrow<string>('GET_ITEM_BASE_INFO_PATH');
  }

  async getProductsList(data: GetProductList) {
    const cachedTokenAndShopId = await this.shopeeTokenService.getValidAccessToken(data.userId, data.shopId);

    const signedUrl = this.shopeeAuthService.generateSignedUrl({
      path: this.getProductListPath,
      accessToken: cachedTokenAndShopId.access_token,
      shopId: Number(cachedTokenAndShopId.external_shop_id),
    });

    const urlWithTimeFilter = `${signedUrl}&offset=${data.offset}&page_size=${data.page_size}&item_status=${data.item_status}&update_time_from=${data.update_time_from}&update_time_to=${data.update_time_to}`;

    const urlWithoutTimeFilter = `${signedUrl}&offset=${data.offset}&page_size=${data.page_size}&item_status=${data.item_status}`;

    const hasTimeFilter = data.update_time_from && data.update_time_to;

    const encodeUrl = encodeURI(hasTimeFilter ? urlWithTimeFilter : urlWithoutTimeFilter);

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

  async getProductsInfo(data: GetProductsInfo) {
    const cachedTokenAndShopId = await this.shopeeTokenService.getValidAccessToken(data.userId, data.shopId);

    const signedUrl = this.shopeeAuthService.generateSignedUrl({
      path: this.getProductInfoPath,
      accessToken: cachedTokenAndShopId.access_token,
      shopId: Number(cachedTokenAndShopId.external_shop_id),
    });

    const encodeUrl = encodeURI(
      `${signedUrl}&item_id_list=${data.itemIdList}&need_tax_info=true&need_complaint_policy=true`,
    );

    const response = await fetch(encodeUrl);

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao buscar lista de produtos: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const productsInfo = await response.json();

    return productsInfo.response;
  }

  async upsertBulkProducts({ shopId, products }: { shopId: string; products: CreateProductInput[] }) {
    const MAX_ALLOWED = constants.MAX_NUMBER_PRODUCTS_ALLOWED_FOR_QUERY;
    if (products.length > MAX_ALLOWED) {
      throw new BadRequestException(
        `Limite de produtos para operação no banco de dados excedido: ${products.length} produtos recebidos. Máximo permitido: ${MAX_ALLOWED}`,
      );
    }

    const affected = await this.productsRepo.upsertChunkProducts(shopId, products);

    const inserted = affected.filter((product) => product.wasInserted);
    const updated = affected.filter((product) => !product.wasInserted);

    this.logger.debug(`Produtos inseridos: ${inserted.length}, Produtos atualizados: ${updated.length}.`);

    return {
      products_inserted: inserted.length,
      products_updated: updated.length,
    };
  }

  async getProductsFull(_userId: string, shopId: string, pagination: GetProductFullDTO) {
    return this.productsRepo.getProductsFull(shopId, pagination);
  }

  async updateCostAndTaxes(_userId: string, shopId: string, data: ProductsUpdateCostAndTaxesDTO) {
    if (data.products.length > constants.MAX_NUMBER_PRODUCTS_TO_UPDATE) {
      throw new BadRequestException(
        `Não é possível atualizar mais de ${constants.MAX_NUMBER_PRODUCTS_TO_UPDATE} produtos por operação`,
      );
    }

    const totalUpdatedProducts = await this.productsRepo.updateCostAndTaxes(shopId, data.products);

    return {
      message: `${totalUpdatedProducts.length} produtos foram atualizados.`,
    };
  }
}
