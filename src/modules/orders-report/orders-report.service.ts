import { HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/configs/env.schema';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopeeTokenService } from '../integrations/shopee/token/shopee-token.service';
import { OrdersService } from '../orders/orders.service';
import { GetOrderList } from '../orders/orders.type';
import { ProductsService } from '../products/products.service';
import { OrderReportItemDTO, OrdersReportResponseDTO } from './orders-report.dto';
import { EscrowDetailBatchResponse, GetOrderEscrowDetails, OrderEscrowDetail } from './orders-report.type';
import { OrdersReportCalculator } from './orders-report-calculator.service';

@Injectable()
export class OrdersReportService {
  private readonly logger = new Logger(OrdersService.name);

  private readonly getEscrowDetailsBatchPath: string;

  constructor(
    private readonly configService: ConfigService<Env>,
    private readonly shopeeTokenService: ShopeeTokenService,
    private readonly shopeeAuthService: ShopeeAuthService,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly calculator: OrdersReportCalculator,
  ) {
    this.getEscrowDetailsBatchPath = this.configService.getOrThrow<string>('GET_ESCROW_DETAIL_BATCH_PATH');
  }

  async getOrdersReport(data: GetOrderList): Promise<OrdersReportResponseDTO> {
    const ordersList = await this.ordersService.getOrderList(data);

    if (!ordersList.order_list?.length) {
      throw new NotFoundException('Nenhum pedido encontrado');
    }

    const ordersIdList = ordersList.order_list.map((order) => order.order_sn);
    const escrowDetails = await this.getEscrowDetailsBatch({
      userId: data.userId,
      shopId: data.shopId,
      order_ids: ordersIdList,
    });

    if (!escrowDetails.length) {
      throw new NotFoundException('Detalhes do pagamento dos pedidos não encontrados');
    }

    const uniqueProductIds = [
      ...new Set<string>(
        escrowDetails.flatMap((detail) => detail.order_income.items.map((item) => String(item.item_id))),
      ),
    ];

    const products = await this.productsService.getEspecificProductsByIds(data.userId, data.shopId, uniqueProductIds);

    const orderResults = this.calculator.calculateOrdersFromEscrow(escrowDetails, products);
    const summary = this.calculator.calculateSummary(orderResults);

    const orderResultMap = new Map(orderResults.map((result) => [result.orderSn, result]));

    const reportOrders: OrderReportItemDTO[] = ordersList.order_list.map((order) => {
      const result = orderResultMap.get(order.order_sn);

      if (!result) {
        throw new NotFoundException(`Detalhes de pagamento não encontrados para o pedido ${order.order_sn}`);
      }

      return {
        order_sn: order.order_sn,
        order_status: order.order_status,
        payment_method: result.paymentMethod,
        total_amount: this.calculator.fromCents(result.totalAmountCents),
        shipping_paid_by_seller: this.calculator.fromCents(result.shippingFeeCents),
        shopee_commission: this.calculator.fromCents(result.commissionFeeCents),
        total_government_taxes: this.calculator.fromCents(result.totalGovernmentTaxesCents),
        items_cost: result.itemsCostCents !== null ? this.calculator.fromCents(result.itemsCostCents) : null,
        total_cost: result.totalCostCents !== null ? this.calculator.fromCents(result.totalCostCents) : null,
        net_profit_margin: result.netProfitCents !== null ? this.calculator.fromCents(result.netProfitCents) : null,
        margin_percent: result.marginPercent,
        has_partial_cost_data: result.hasPartialCostData,
        items_breakdown: result.itemsBreakdown.map((item) => ({
          item_id: item.itemId,
          item_name: item.itemName,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: this.calculator.fromCents(item.unitPriceCents),
          unit_cost: item.unitCostCents !== null ? this.calculator.fromCents(item.unitCostCents) : null,
          unit_government_taxes:
            item.unitGovernmentTaxesCents !== null ? this.calculator.fromCents(item.unitGovernmentTaxesCents) : null,
          total_government_taxes:
            item.itemGovernmentTaxesCents !== null ? this.calculator.fromCents(item.itemGovernmentTaxesCents) : null,
          revenue: this.calculator.fromCents(item.revenueCents),
          total_cost: item.totalCostCents !== null ? this.calculator.fromCents(item.totalCostCents) : null,
          net_profit: item.netProfitCents !== null ? this.calculator.fromCents(item.netProfitCents) : null,
          is_matched_to_product: item.isMatchedToProduct,
        })),
      };
    });

    return {
      orders: reportOrders,
      summary: {
        total_orders: summary.totalOrders,
        total_revenue: this.calculator.fromCents(summary.totalRevenueCents),
        total_shipping: this.calculator.fromCents(summary.totalShippingCents),
        total_shopee_commission: this.calculator.fromCents(summary.totalCommissionCents),
        total_items_cost:
          summary.totalItemsCostCents !== null ? this.calculator.fromCents(summary.totalItemsCostCents) : null,
        total_cost: summary.totalCostCents !== null ? this.calculator.fromCents(summary.totalCostCents) : null,
        total_government_taxes: this.calculator.fromCents(summary.totalGovernmentTaxesCents),
        total_net_profit:
          summary.totalNetProfitCents !== null ? this.calculator.fromCents(summary.totalNetProfitCents) : null,
        overall_margin_percent: summary.overallMarginPercent,
        orders_with_missing_cost_data: summary.ordersWithMissingCostData,
        unmatched_item_skus: summary.unmatchedItemSkus,
      },
    };
  }

  async getEscrowDetailsBatch(data: GetOrderEscrowDetails): Promise<OrderEscrowDetail[]> {
    const cachedTokenAndShopId = await this.shopeeTokenService.getValidAccessToken(data.userId, data.shopId);

    const signedUrl = this.shopeeAuthService.generateSignedUrl({
      path: this.getEscrowDetailsBatchPath,
      accessToken: cachedTokenAndShopId.access_token,
      shopId: Number(cachedTokenAndShopId.external_shop_id),
    });

    const encodeUrl = encodeURI(signedUrl);

    const response = await fetch(encodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_sn_list: data.order_ids }),
    });

    if (!response.ok) {
      this.logger.error('API Shopee: falha ao buscar detalhes do pagamento do pedido: \n', response);
      throw new HttpException(`API Shopee: ${response.statusText}`, response.status, {
        cause: new Error(response.statusText),
      });
    }

    const ordersEscrowDetails: { response: EscrowDetailBatchResponse[] } = await response.json();

    return ordersEscrowDetails.response.map((entry) => entry.escrow_detail);
  }
}
