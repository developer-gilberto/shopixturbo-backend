import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceType, Product } from 'src/generated/prisma/client';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopeeTokenService } from '../integrations/shopee/token/shopee-token.service';
import { OrderStatus, TimeRangeField } from '../orders/orders.enum';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { OrdersReportService } from './orders-report.service';
import type { OrderEscrowDetail } from './orders-report.type';
import { OrdersReportCalculator } from './orders-report-calculator.service';

describe('OrdersReportService', () => {
  let service: OrdersReportService;
  let ordersService: jest.Mocked<OrdersService>;
  let productsService: jest.Mocked<ProductsService>;

  const getOrderListData = {
    userId: 'user-1',
    shopId: 'shop-1',
    offset: 0,
    page_size: 20,
    interval_days: 7,
    time_range_field: TimeRangeField.CREATE_TIME,
    order_status: OrderStatus.COMPLETED,
  };

  const ordersList = {
    more: true,
    next_cursor: '3',
    order_list: [
      {
        order_sn: '260830NDGSTMP6',
        order_status: OrderStatus.COMPLETED,
        country: 'BR',
        total_amount: 68.51,
        order_creation_time: 1750000000,
      },
    ],
  };

  const escrowDetail: OrderEscrowDetail = {
    order_sn: '260830NDGSTMP6',
    buyer_user_name: 'local_regress.br',
    buyer_payment_info: {
      buyer_payment_method: 'Pix',
      buyer_total_amount: 68.51,
      merchant_subtotal: 58.89,
      shipping_fee: 9.62,
    },
    order_income: {
      actual_shipping_fee: 9.62,
      buyer_paid_shipping_fee: 9.62,
      shopee_shipping_rebate: 0,
      shipping_fee_discount_from_3pl: 0,
      commission_fee: 0,
      buyer_total_amount: 68.51,
      cost_of_goods_sold: 58.89,
      escrow_amount: 55.46,
      order_selling_price: 58.89,
      items: [
        {
          item_id: 885178163,
          item_name: 'Mouse',
          item_sku: 'mouse-sku',
          model_sku: '',
          quantity_purchased: 1,
          discounted_price: 34.9,
          selling_price: 34.9,
          original_price: 34.9,
        },
        {
          item_id: 885178164,
          item_name: 'Lanterna',
          item_sku: 'lanterna-sku',
          model_sku: '',
          quantity_purchased: 1,
          discounted_price: 23.99,
          selling_price: 23.99,
          original_price: 23.99,
        },
      ],
    },
    return_order_sn_list: [],
  };

  const products: Product[] = [
    {
      id: 'prod-885178163',
      marketplace: MarketplaceType.SHOPEE,
      category_id: 0,
      name: 'Mouse',
      sku: 'mouse-sku',
      image_url: null,
      stock: 0,
      sale_price_cents: 3490,
      cost_price_cents: 1500,
      government_taxes: 200,
      external_id: '885178163',
      external_created_at: null,
      external_updated_at: new Date(),
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      shop_id: 'shop-1',
    },
    {
      id: 'prod-885178164',
      marketplace: MarketplaceType.SHOPEE,
      category_id: 0,
      name: 'Lanterna',
      sku: 'lanterna-sku',
      image_url: null,
      stock: 0,
      sale_price_cents: 2399,
      cost_price_cents: 1000,
      government_taxes: 150,
      external_id: '885178164',
      external_created_at: null,
      external_updated_at: new Date(),
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      shop_id: 'shop-1',
    },
  ];

  const mockFetchOk = (payload: unknown) =>
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response);

  const mockFetchFail = (status: number, statusText: string) =>
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status,
      statusText,
    } as Response);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersReportService,
        OrdersReportCalculator,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('/api/escrow-detail-batch') },
        },
        {
          provide: ShopeeTokenService,
          useValue: {
            getValidAccessToken: jest.fn().mockResolvedValue({
              access_token: 'token',
              external_shop_id: '1',
            }),
          },
        },
        {
          provide: ShopeeAuthService,
          useValue: { generateSignedUrl: jest.fn().mockReturnValue('https://partner.shopeemobile.com/path') },
        },
        {
          provide: OrdersService,
          useValue: { getOrderList: jest.fn() },
        },
        {
          provide: ProductsService,
          useValue: { getEspecificProductsByIds: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(OrdersReportService);
    ordersService = module.get(OrdersService);
    productsService = module.get(ProductsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getOrdersReport', () => {
    it('monta o relatório completo com custos e lucros calculados', async () => {
      ordersService.getOrderList.mockResolvedValue(ordersList as never);
      productsService.getEspecificProductsByIds.mockResolvedValue(products as never);
      const fetchSpy = mockFetchOk({ response: [{ escrow_detail: escrowDetail }] });

      const result = await service.getOrdersReport(getOrderListData);

      expect(ordersService.getOrderList).toHaveBeenCalledWith(getOrderListData);
      expect(productsService.getEspecificProductsByIds).toHaveBeenCalledWith('user-1', 'shop-1', [
        '885178163',
        '885178164',
      ]);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/path'),
        expect.objectContaining({ method: 'POST' }),
      );

      expect(result.orders).toHaveLength(1);
      const order = result.orders[0];
      expect(order.order_sn).toBe('260830NDGSTMP6');
      expect(order.order_status).toBe(OrderStatus.COMPLETED);
      expect(order.payment_method).toBe('Pix');
      expect(order.total_amount).toBeCloseTo(58.89, 2);
      expect(order.total_government_taxes).toBeCloseTo(3.5, 2);
      expect(order.items_cost).toBeCloseTo(25, 2);
      expect(order.shipping_paid_by_seller).toBeCloseTo(0, 2);
      expect(order.shopee_commission).toBeCloseTo(0, 2);
      expect(order.total_cost).toBeCloseTo(28.5, 2);
      expect(order.net_profit_margin).toBeCloseTo(30.39, 2);
      expect(order.items_breakdown).toHaveLength(2);
      expect(order.items_breakdown[0].is_matched_to_product).toBe(true);

      expect(result.summary.total_orders).toBe(1);
      expect(result.summary.total_revenue).toBeCloseTo(58.89, 2);
      expect(result.summary.total_shopee_commission).toBeCloseTo(0, 2);
      expect(result.summary.total_items_cost).toBeCloseTo(25, 2);
      expect(result.summary.total_cost).toBeCloseTo(28.5, 2);
      expect(result.summary.total_net_profit).toBeCloseTo(30.39, 2);
      expect(result.summary.unmatched_item_skus).toEqual([]);
      expect(result.summary.products_with_missing_cost_data).toEqual([]);
      expect(result.summary.orders_with_missing_cost_data).toEqual([]);

      expect(result.pagination).toEqual({ more: true, next_cursor: '3' });
    });

    it('lança NotFoundException quando não há pedidos na lista', async () => {
      ordersService.getOrderList.mockResolvedValue({ order_list: [] } as never);

      await expect(service.getOrdersReport(getOrderListData)).rejects.toThrow(
        new NotFoundException('Nenhum pedido encontrado'),
      );
    });

    it('lança NotFoundException quando não há detalhes financeiros', async () => {
      ordersService.getOrderList.mockResolvedValue(ordersList as never);
      mockFetchOk({ response: [] });

      await expect(service.getOrdersReport(getOrderListData)).rejects.toThrow(
        new NotFoundException('Detalhes do pagamento dos pedidos não encontrados'),
      );
    });

    it('lança NotFoundException quando um pedido não possui detalhes correspondentes', async () => {
      ordersService.getOrderList.mockResolvedValue({
        order_list: [{ order_sn: 'PEDIDO-SEM-DETAIL', order_status: OrderStatus.COMPLETED }],
      } as never);
      mockFetchOk({
        response: [{ escrow_detail: { ...escrowDetail, order_sn: 'OUTRO' } }],
      });
      productsService.getEspecificProductsByIds.mockResolvedValue([] as never);

      await expect(service.getOrdersReport(getOrderListData)).rejects.toThrow(
        new NotFoundException('Detalhes de pagamento não encontrados para o pedido PEDIDO-SEM-DETAIL'),
      );
    });

    it('propaga HttpException quando a API de escrow retorna erro HTTP', async () => {
      ordersService.getOrderList.mockResolvedValue(ordersList as never);
      mockFetchFail(500, 'Internal Server Error');

      await expect(service.getOrdersReport(getOrderListData)).rejects.toThrow(expect.objectContaining({ status: 500 }));
    });

    it('usa uniqueProductIds sem duplicatas ao buscar produtos', async () => {
      ordersService.getOrderList.mockResolvedValue({
        order_list: [
          { order_sn: 'A', order_status: OrderStatus.COMPLETED },
          { order_sn: 'B', order_status: OrderStatus.COMPLETED },
        ],
      } as never);
      mockFetchOk({
        response: [
          { escrow_detail: { ...escrowDetail, order_sn: 'A' } },
          { escrow_detail: { ...escrowDetail, order_sn: 'B' } },
        ],
      });
      productsService.getEspecificProductsByIds.mockResolvedValue(products as never);

      await service.getOrdersReport(getOrderListData);

      expect(productsService.getEspecificProductsByIds).toHaveBeenCalledWith('user-1', 'shop-1', [
        '885178163',
        '885178164',
      ]);
    });
  });
});
