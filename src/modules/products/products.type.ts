import { MarketplaceType } from 'src/generated/prisma/enums';
import { ItemStatus } from './products.enum';

export interface GetProductList {
  userId: string;
  shopId: string;
  offset: number;
  page_size: number;
  update_time_from?: number;
  update_time_to?: number;
  item_status: ItemStatus;
}

export interface GetProductsInfo {
  userId: string;
  shopId: string;
  itemIdList: number[];
}

export interface CreateProductInput {
  marketplace: MarketplaceType;
  category_id: number;
  name: string;
  sku?: string | null;
  image_url?: string | null;
  stock: number;
  sale_price_cents: number;
  cost_price_cents?: number | null;
  government_taxes?: number | null;
  external_id?: string | null;
  external_created_at?: Date | null;
  external_updated_at: Date;
  deleted_at?: Date | null;
  shop_id: string;
}
