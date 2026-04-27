import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/configs/env.schema';
import { getTimeRange } from 'src/utils/getTimeRanger';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopeeTokenService } from '../integrations/shopee/token/shopee-token.service';
import { GetOrderDetails, GetOrderList } from './orders.type';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  private readonly getOrderListPath: string;
  private readonly getOrderDetailsPath: string;

  constructor(
    private readonly configService: ConfigService<Env>,
    private readonly shopeeTokenService: ShopeeTokenService,
    private readonly shopeeAuthService: ShopeeAuthService,
  ) {
    this.getOrderListPath = this.configService.getOrThrow<string>('GET_ORDER_LIST_PATH');
    this.getOrderDetailsPath = this.configService.getOrThrow<string>('GET_ORDER_DETAIL_PATH');
  }

  async getOrderList(data: GetOrderList) {
    const cachedTokenAndShopId = await this.shopeeTokenService.getValidAccessToken(data.userId, data.shopId);

    const signedUrl = this.shopeeAuthService.generateSignedUrl({
      path: this.getOrderListPath,
      accessToken: cachedTokenAndShopId.access_token,
      shopId: Number(cachedTokenAndShopId.external_shop_id),
    });

    const { timestampFrom, timestampTo } = getTimeRange(data.interval_days);

    const url = `${signedUrl}&offset=${data.offset}&page_size=${data.page_size}&time_range_field=${data.time_range_field}&time_from=${timestampFrom}&time_to=${timestampTo}&order_status=${data.order_status}`;

    const encodeUrl = encodeURI(url);

    const response = await fetch(encodeUrl);

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao buscar lista de pedidos: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const ordersList = await response.json();

    return ordersList.response;
  }

  async getOrderDetails(data: GetOrderDetails) {
    const cachedTokenAndShopId = await this.shopeeTokenService.getValidAccessToken(data.userId, data.shopId);

    const signedUrl = this.shopeeAuthService.generateSignedUrl({
      path: this.getOrderDetailsPath,
      accessToken: cachedTokenAndShopId.access_token,
      shopId: Number(cachedTokenAndShopId.external_shop_id),
    });

    const optionalFields =
      'buyer_user_id,buyer_username,estimated_shipping_fee,recipient_address,actual_shipping_fee ,goods_to_declare,note,note_update_time,item_list,pay_time,dropshipper, dropshipper_phone,split_up,buyer_cancel_reason,cancel_by,cancel_reason,actual_shipping_fee_confirmed,buyer_cpf_id,fulfillment_flag,pickup_done_time,package_list,shipping_carrier,payment_method,total_amount,buyer_username,invoice_data,order_chargeable_weight_gram,return_request_due_date,edt,payment_info';

    const url = `${signedUrl}&order_sn_list=${data.order_id_list}&request_order_status_pending=true&response_optional_fields=${optionalFields}`;

    const encodeUrl = encodeURI(url);

    const response = await fetch(encodeUrl);

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao buscar detalhes de pedidos: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const ordersDetails = await response.json();

    return ordersDetails.response;
  }
}
