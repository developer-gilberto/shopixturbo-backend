import { MarketplaceType, SyncStatus, SyncType } from 'src/generated/prisma/enums';

export interface SyncControl {
  id: string;
  shop_id: string;
  marketplace: MarketplaceType;
  locked_at: Date | null;
  last_sync_at: Date | null;
  last_cursor: string | null;
  status: SyncStatus;
  sync_type: SyncType;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductsSyncControlInput {
  shop_id: string;
  marketplace: MarketplaceType;
  locked_at?: Date | null;
  last_sync_at?: Date | null;
  last_cursor?: string | null;
  status?: SyncStatus;
  sync_type?: SyncType;
  last_error?: string | null;
}

interface ShopeeItemStockSummary {
  total_available_stock: number;
}

interface ShopeeItemStockInfoV2 {
  summary_info: ShopeeItemStockSummary;
}

interface ShopeeItemPriceInfo {
  current_price: number;
}

interface ShopeeItemImage {
  image_url_list: string[];
}

export interface ShopeeProductItem {
  item_id: number;
  category_id: number;
  item_name: string;
  item_sku: string;
  create_time: number;
  update_time: number;
  price_info: [ShopeeItemPriceInfo, ...ShopeeItemPriceInfo[]]; // tuple garante ao menos 1 elemento
  image: ShopeeItemImage;
  stock_info_v2: ShopeeItemStockInfoV2;
}

export interface ShopeeGetItemInfoResponse {
  item_list: ShopeeProductItem[];
}

export type ShopeeItemStatus = 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST';

export interface ShopeeItems {
  item_id: number;
  item_status: ShopeeItemStatus;
  update_time: number;
}

export interface ShopeeGetItemIdListResponse {
  item: ShopeeItems[];
  total_count: number;
  has_next_page: boolean;
  next_offset: number;
  next: string;
}

export interface SyncProducts {
  userId: string;
  shopId: string;
  syncControl: SyncControl;
  updateTimeFrom?: number;
  updateTimeTo?: number;
}
