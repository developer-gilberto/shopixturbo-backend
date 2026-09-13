import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ShopeeAuthService } from '../integrations/shopee/auth/shopee-auth.service';
import { ShopeeTokenService } from '../integrations/shopee/token/shopee-token.service';
import { ItemStatus } from './products.enum';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let shopeeTokenService: jest.Mocked<ShopeeTokenService>;
  let shopeeAuthService: jest.Mocked<ShopeeAuthService>;
  let productsRepo: jest.Mocked<ProductsRepository>;

  const tokenAndShopId = { access_token: 'token-1', external_shop_id: '123' };
  const fetchMock = jest.fn();

  beforeEach(async () => {
    fetchMock.mockReset();

    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest
              .fn()
              .mockImplementation((key: string) => (key === 'GET_ITEM_LIST_PATH' ? '/list' : '/info')),
          },
        },
        {
          provide: ShopeeTokenService,
          useValue: { getValidAccessToken: jest.fn() },
        },
        {
          provide: ShopeeAuthService,
          useValue: { generateSignedUrl: jest.fn().mockReturnValue('https://api.example.com/base') },
        },
        {
          provide: ProductsRepository,
          useValue: {
            upsertChunkProducts: jest.fn(),
            getProductsFull: jest.fn(),
            updateCostAndTaxes: jest.fn(),
            getEspecificProductsByIds: jest.fn(),
            getSpecificProductById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
    shopeeTokenService = module.get(ShopeeTokenService);
    shopeeAuthService = module.get(ShopeeAuthService);
    productsRepo = module.get(ProductsRepository);

    shopeeTokenService.getValidAccessToken.mockResolvedValue(tokenAndShopId as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProductsList', () => {
    it('retorna a lista de produtos da resposta com filtro de tempo', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ response: { item: [{ item_id: 1 }] } }),
      } as never);

      const result = await service.getProductsList({
        userId: 'u1',
        shopId: 's1',
        offset: 0,
        page_size: 10,
        item_status: ItemStatus.NORMAL,
        update_time_from: 100,
        update_time_to: 200,
      });

      expect(shopeeTokenService.getValidAccessToken).toHaveBeenCalledWith('u1', 's1');
      expect(shopeeAuthService.generateSignedUrl).toHaveBeenCalledWith({
        path: '/list',
        accessToken: 'token-1',
        shopId: 123,
      });
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('update_time_from=100'));
      expect(result).toEqual({ item: [{ item_id: 1 }] });
    });

    it('monta a URL sem filtro de tempo quando os timestamps não são informados', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ response: {} }),
      } as never);

      await service.getProductsList({
        userId: 'u1',
        shopId: 's1',
        offset: 1,
        page_size: 10,
        item_status: ItemStatus.NORMAL,
      });

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('&offset=1&page_size=10&item_status=NORMAL');
      expect(calledUrl).not.toContain('update_time_from');
    });

    it('lança HttpException quando a API Shopee retorna erro', async () => {
      fetchMock.mockResolvedValue({ ok: false, statusText: 'Bad Gateway', status: 502 } as never);

      await expect(
        service.getProductsList({
          userId: 'u1',
          shopId: 's1',
          offset: 0,
          page_size: 10,
          item_status: ItemStatus.NORMAL,
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getProductsInfo', () => {
    it('retorna as informações dos produtos da resposta', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ response: { item_list: [] } }),
      } as never);

      const result = await service.getProductsInfo({ userId: 'u1', shopId: 's1', itemIdList: [1, 2] });

      expect(shopeeAuthService.generateSignedUrl).toHaveBeenCalledWith({
        path: '/info',
        accessToken: 'token-1',
        shopId: 123,
      });
      expect(result).toEqual({ item_list: [] });
    });

    it('lança HttpException quando a API Shopee retorna erro', async () => {
      fetchMock.mockResolvedValue({ ok: false, statusText: 'Nope', status: 500 } as never);

      await expect(service.getProductsInfo({ userId: 'u1', shopId: 's1', itemIdList: [1] })).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('upsertBulkProducts', () => {
    it('lança BadRequestException quando excede o limite de produtos', async () => {
      const products = Array.from({ length: 101 }, (_, i) => ({ id: i })) as never;

      await expect(service.upsertBulkProducts({ shopId: 's1', products })).rejects.toThrow(BadRequestException);
      expect(productsRepo.upsertChunkProducts).not.toHaveBeenCalled();
    });

    it('retorna a contagem de produtos inseridos e atualizados', async () => {
      productsRepo.upsertChunkProducts.mockResolvedValue([
        { wasInserted: true },
        { wasInserted: true },
        { wasInserted: false },
      ] as never);

      const result = await service.upsertBulkProducts({
        shopId: 's1',
        products: [{ id: 1 }, { id: 2 }, { id: 3 }] as never,
      });

      expect(productsRepo.upsertChunkProducts).toHaveBeenCalled();
      expect(result).toEqual({ products_inserted: 2, products_updated: 1 });
    });
  });

  describe('getProductsFull', () => {
    it('delega ao repositório', async () => {
      const pagination = { page: 1, limit: 10 } as never;
      productsRepo.getProductsFull.mockResolvedValue('data' as never);

      await expect(service.getProductsFull('u1', 's1', pagination)).resolves.toBe('data');
      expect(productsRepo.getProductsFull).toHaveBeenCalledWith('s1', pagination);
    });
  });

  describe('updateCostAndTaxes', () => {
    it('lança BadRequestException quando excede o limite de atualização', async () => {
      const data = { products: Array.from({ length: 101 }, () => ({})) } as never;

      await expect(service.updateCostAndTaxes('u1', 's1', data)).rejects.toThrow(BadRequestException);
    });

    it('retorna a mensagem com o total de produtos atualizados', async () => {
      const products = [{ id: 1 }, { id: 2 }];
      productsRepo.updateCostAndTaxes.mockResolvedValue([{}, {}] as never);

      const result = await service.updateCostAndTaxes('u1', 's1', { products } as never);

      expect(productsRepo.updateCostAndTaxes).toHaveBeenCalledWith('s1', products);
      expect(result).toEqual({ message: '2 produtos foram atualizados.' });
    });
  });

  describe('getEspecificProductsByIds', () => {
    it('delega ao repositório', async () => {
      productsRepo.getEspecificProductsByIds.mockResolvedValue(['a'] as never);

      const result = await service.getEspecificProductsByIds('u1', 's1', ['1', '2']);

      expect(productsRepo.getEspecificProductsByIds).toHaveBeenCalledWith('s1', ['1', '2']);
      expect(result).toEqual(['a']);
    });
  });

  describe('getSpecificProductById', () => {
    it('delega ao repositório e retorna o product encontrado', async () => {
      const mockProduct = { id: 'p1', external_id: '100' };
      productsRepo.getSpecificProductById.mockResolvedValue(mockProduct as never);

      const result = await service.getSpecificProductById('u1', 's1', '100');

      expect(productsRepo.getSpecificProductById).toHaveBeenCalledWith('s1', '100');
      expect(result).toEqual(mockProduct);
    });

    it('lança NotFoundException quando o product não é encontrado', async () => {
      productsRepo.getSpecificProductById.mockResolvedValue(null as never);

      await expect(service.getSpecificProductById('u1', 's1', '999')).rejects.toThrow(NotFoundException);
      expect(productsRepo.getSpecificProductById).toHaveBeenCalledWith('s1', '999');
    });
  });
});
