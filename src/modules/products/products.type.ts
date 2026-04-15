import { ItemStatus } from './products.enum';

export interface GetProductList {
  userId: string;
  shopId: string;
  offset: number;
  page_size: number;
  update_time_from: number;
  update_time_to: number;
  item_status: ItemStatus;
}

export interface GetProductsInfo {
  userId: string;
  shopId: string;
  itemIdList: number[];
}
