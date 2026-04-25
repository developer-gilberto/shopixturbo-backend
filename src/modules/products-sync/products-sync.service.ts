import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RateLimitService } from 'src/common/services/rate-limit/rate-limit.service';
import { cache } from 'src/configs/cache.config';
import { constants } from 'src/configs/constants.config';
import { MarketplaceType } from 'src/generated/prisma/enums';
import { ItemStatus } from '../products/products.enum';
import { ProductsService } from '../products/products.service';
import { CreateProductInput } from '../products/products.type';
import {
  CreateProductsSyncControlInput,
  ShopeeGetItemIdListResponse,
  ShopeeGetItemInfoResponse,
  SyncProducts,
} from './products-sync.type';
import { ProductsSyncControlRepository } from './products-sync-control.repository';

@Injectable()
export class ProductsSyncService {
  private readonly logger = new Logger(ProductsSyncService.name);

  constructor(
    private readonly productService: ProductsService,
    private readonly productSyncControlRepo: ProductsSyncControlRepository,
    private readonly rateLimit: RateLimitService,
  ) {}

  async syncProducts(userId: string, shopId: string, updateTimeFrom?: number, updateTimeTo?: number) {
    const syncControl = await this.productSyncControlRepo.findByShopId(shopId);

    if (!syncControl) {
      throw new NotFoundException('Controle de sincronização não encontrado para esta loja');
    }

    if (syncControl.locked_at) {
      throw new ConflictException('Sincronização em andamento para esta loja');
    }

    await this.productSyncControlRepo.start(syncControl.id);

    try {
      const result = await this.sync({ userId, shopId, syncControl, updateTimeFrom, updateTimeTo });
      await this.productSyncControlRepo.complete(syncControl.id);

      this.logger.log('Produtos sincronizados com sucesso!');

      return result;
    } catch (err) {
      this.logger.error('ERRO: falha ao sincronizar produtos: \n', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.productSyncControlRepo.fail(syncControl.id, errorMessage);
      throw err;
    } finally {
      await this.productSyncControlRepo.unlock(syncControl.id).catch((err) => {
        this.logger.error({ err, syncControlId: syncControl.id }, 'Falha ao liberar lock da sincronização');
      });
    }
  }

  private async sync(syncData: SyncProducts) {
    let offset = Number(syncData.syncControl.last_cursor || 0);
    let hasNextPage = true;
    let maxUpdatedAt: Date = syncData.syncControl.last_sync_at ?? new Date(0);
    let pageCount = 0;

    const lastSyncWithFiveMinutesSafetyMargin = syncData.syncControl.last_sync_at
      ? Math.floor(new Date(syncData.syncControl.last_sync_at).getTime() / 1000) -
        Math.floor(constants.FIVE_MINUTES_IN_MILLISECONDS / 1000)
      : 0;

    try {
      const userId = syncData.userId;
      const shopId = syncData.shopId;

      let productsInserted: number = 0;
      let productsUpdated: number = 0;

      while (hasNextPage && pageCount < constants.MAX_PRODUCTS_PAGE) {
        pageCount++;

        await this.rateLimit.limitOrWait(
          cache.rateLimitKey('shopee', shopId),
          cache.shopeeRateLimit,
          cache.shopeeRateLimitWindowMs,
        );

        const productIdList: ShopeeGetItemIdListResponse = await this.productService.getProductsList({
          userId,
          shopId,
          offset,
          page_size: constants.PAGE_SIZE_PRODUCTS_SYNC,
          update_time_from: syncData.updateTimeFrom ?? lastSyncWithFiveMinutesSafetyMargin,
          update_time_to: syncData.updateTimeTo ?? Math.floor(Date.now() / 1000),
          item_status: ItemStatus.NORMAL,
        });

        if (!productIdList.item?.length) {
          this.logger.debug({ shopId, offset }, 'Nenhum produto retornado nesta página');
          break;
        }

        await this.rateLimit.limitOrWait(
          cache.rateLimitKey('shopee', shopId),
          cache.shopeeRateLimit,
          cache.shopeeRateLimitWindowMs,
        );

        const products: ShopeeGetItemInfoResponse = await this.productService.getProductsInfo({
          userId,
          shopId,
          itemIdList: productIdList.item.map((product) => product.item_id),
        });

        const productsToUpsert: CreateProductInput[] = [];

        for (const item of products.item_list) {
          const updatedAt = new Date(item.update_time * 1000);
          if (updatedAt > maxUpdatedAt) maxUpdatedAt = updatedAt;

          productsToUpsert.push({
            marketplace: MarketplaceType.SHOPEE,
            category_id: Number(item.category_id),
            name: item.item_name,
            sku: item.item_sku,
            image_url: item.image?.image_url_list?.[0] ?? null,
            stock: Number(item.stock_info_v2?.summary_info?.total_available_stock ?? 0),
            sale_price_cents: Math.round((item.price_info?.[0]?.current_price ?? 0) * 100),
            external_id: String(item.item_id),
            external_created_at: item.create_time ? new Date(item.create_time * 1000) : null,
            external_updated_at: updatedAt,
            shop_id: syncData.syncControl.shop_id,
          });
        }

        if (productsToUpsert.length > 0) {
          const affected = await this.productService.upsertBulkProducts({ shopId, products: productsToUpsert });
          productsInserted += affected.products_inserted;
          productsUpdated += affected.products_updated;
        }

        hasNextPage = productIdList.has_next_page;

        if (hasNextPage) {
          const nextOffset = productIdList.next_offset;

          if (nextOffset === offset) {
            throw new Error(`next_offset não avançou (offset=${offset}). Possível loop infinito detectado.`);
          }

          offset = nextOffset;
        }

        await this.productSyncControlRepo.updateCursor(syncData.syncControl.id, offset);
      }

      await this.productSyncControlRepo.finish(syncData.syncControl.id, maxUpdatedAt);
      return {
        shop: syncData.shopId,
        latest_sync: maxUpdatedAt,
        products_inserted: productsInserted,
        products_updated: productsUpdated,
      };
    } catch (err) {
      this.logger.error({ err }, `Erro durante sincronização de produtos do shop: ${syncData.shopId}`);
      throw err;
    }
  }

  async createInitialRecord(data: CreateProductsSyncControlInput) {
    return this.productSyncControlRepo.create(data);
  }
}
