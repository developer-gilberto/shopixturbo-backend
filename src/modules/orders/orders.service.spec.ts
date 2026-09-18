import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopeeTokenService } from '../integrations/shopee/token/shopee-token.service';
import { OrderStatus, TimeRangeField } from './orders.enum';
import { OrdersService } from './orders.service';
import { GetOrderDetails, GetOrderList } from './orders.type';

describe('OrdersService', () => {
  let service: OrdersService;
  let shopeeTokenService: jest.Mocked<ShopeeTokenService>;
  let shopeeAuthService: jest.Mocked<ShopeeAuthService>;

  const mockTokenData = {
    access_token: 'access-token-123',
    external_shop_id: '1001',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const values: Record<string, string> = {
                GET_ORDER_LIST_PATH: '/api/v2/order/get_order_list',
                GET_ORDER_DETAIL_PATH: '/api/v2/order/get_order_detail',
              };
              return values[key];
            }),
          },
        },
        {
          provide: ShopeeTokenService,
          useValue: { getValidAccessToken: jest.fn() },
        },
        {
          provide: ShopeeAuthService,
          useValue: { generateSignedUrl: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    shopeeTokenService = module.get(ShopeeTokenService);
    shopeeAuthService = module.get(ShopeeAuthService);

    shopeeTokenService.getValidAccessToken.mockResolvedValue(mockTokenData as never);
    shopeeAuthService.generateSignedUrl.mockReturnValue('https://api.shopee.com/test?sign=abc');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getOrderList', () => {
    const orderListData: GetOrderList = {
      userId: 'user-1',
      shopId: 'shop-1',
      offset: 0,
      page_size: 20,
      interval_days: 15,
      time_range_field: TimeRangeField.CREATE_TIME,
      order_status: OrderStatus.COMPLETED,
    };

    it('deve retornar a lista de pedidos com sucesso', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ response: { order_list: [{ order_sn: '123' }] } }),
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      const result = await service.getOrderList(orderListData);

      expect(result).toEqual({ order_list: [{ order_sn: '123' }] });
      expect(shopeeTokenService.getValidAccessToken).toHaveBeenCalledWith('user-1', 'shop-1');
      expect(shopeeAuthService.generateSignedUrl).toHaveBeenCalledWith({
        path: '/api/v2/order/get_order_list',
        accessToken: 'access-token-123',
        shopId: 1001,
      });
    });

    it('deve lançar HttpException quando a resposta da API não é ok', async () => {
      const mockResponse = {
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      await expect(service.getOrderList(orderListData)).rejects.toThrow(HttpException);
    });

    it('deve incluir cursor e page_size na URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ response: {} }),
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      await service.getOrderList({ ...orderListData, page_size: 50 });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchCall).toContain('cursor=');
      expect(fetchCall).toContain('page_size=50');
    });

    it('deve enviar o cursor para a API da Shopee quando fornecido', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ response: {} }),
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      await service.getOrderList({ ...orderListData, cursor: '9' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchCall).toContain('cursor=9');
    });

    it('deve incluir order_status na URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ response: {} }),
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      await service.getOrderList(orderListData);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchCall).toContain(`order_status=${OrderStatus.COMPLETED}`);
    });
  });

  describe('getOrderDetails', () => {
    const orderDetailsData: GetOrderDetails = {
      userId: 'user-1',
      shopId: 'shop-1',
      order_id_list: ['ORDER-1', 'ORDER-2'],
    };

    it('deve retornar os detalhes dos pedidos com sucesso', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          response: { order_list: [{ order_sn: 'ORDER-1', status: 'COMPLETED' }] },
        }),
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      const result = await service.getOrderDetails(orderDetailsData);

      expect(result).toEqual({ order_list: [{ order_sn: 'ORDER-1', status: 'COMPLETED' }] });
      expect(shopeeTokenService.getValidAccessToken).toHaveBeenCalledWith('user-1', 'shop-1');
      expect(shopeeAuthService.generateSignedUrl).toHaveBeenCalledWith({
        path: '/api/v2/order/get_order_detail',
        accessToken: 'access-token-123',
        shopId: 1001,
      });
    });

    it('deve lançar HttpException quando a resposta da API não é ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      await expect(service.getOrderDetails(orderDetailsData)).rejects.toThrow(HttpException);
    });

    it('deve incluir order_sn_list na URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ response: {} }),
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      await service.getOrderDetails(orderDetailsData);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchCall).toContain('order_sn_list=ORDER-1,ORDER-2');
    });

    it('deve incluir request_order_status_pending=true na URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ response: {} }),
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      await service.getOrderDetails(orderDetailsData);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchCall).toContain('request_order_status_pending=true');
    });

    it('deve incluir response_optional_fields na URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ response: {} }),
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as never);

      await service.getOrderDetails(orderDetailsData);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchCall).toContain('response_optional_fields=');
    });
  });
});
