import { OrderStatus, TimeRangeField } from './orders.enum';

export interface GetOrderList {
  userId: string;
  shopId: string;
  offset: number;
  page_size: number;
  interval_days: number;
  time_from?: number;
  time_to?: number;
  time_range_field: TimeRangeField;
  order_status: OrderStatus;
  response_optional_fields?: string;
  logistics_channel_id?: number;
}

export interface GetOrderDetails {
  userId: string;
  shopId: string;
  order_id_list: string[];
}
