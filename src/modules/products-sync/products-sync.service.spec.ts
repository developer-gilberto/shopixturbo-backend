import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from 'src/common/services/rate-limit/rate-limit.service';
import { MarketplaceType, SyncStatus, SyncType } from 'src/generated/prisma/enums';
import { ProductsService } from '../products/products.service';
import { ProductsSyncService } from './products-sync.service';
import { SyncControl } from './products-sync.type';
import { ProductsSyncControlRepository } from './products-sync-control.repository';

describe('ProductsSyncService', () => {
  let service: ProductsSyncService;
  let productService: jest.Mocked<ProductsService>;
  let productSyncControlRepo: jest.Mocked<ProductsSyncControlRepository>;
  let rateLimit: jest.Mocked<RateLimitService>;

  const syncControl: SyncControl = {
    id: 'sync-1',
    shop_id: 'shop-1',
    marketplace: MarketplaceType.SHOPEE,
    locked_at: null,
    last_sync_at: null,
    last_cursor: null,
    status: SyncStatus.PENDING,
    sync_type: SyncType.FULL,
    last_error: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsSyncService,
        {
          provide: ProductsService,
          useValue: {
            getProductsList: jest.fn(),
            getProductsInfo: jest.fn(),
            upsertBulkProducts: jest.fn(),
          },
        },
        {
          provide: ProductsSyncControlRepository,
          useValue: {
            findByShopId: jest.fn(),
            start: jest.fn(),
            complete: jest.fn(),
            fail: jest.fn(),
            unlock: jest.fn(),
            updateCursor: jest.fn(),
            finish: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: RateLimitService,
          useValue: { limitOrWait: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ProductsSyncService);
    productService = module.get(ProductsService);
    productSyncControlRepo = module.get(ProductsSyncControlRepository);
    rateLimit = module.get(RateLimitService);

    productSyncControlRepo.findByShopId.mockResolvedValue(syncControl);
    productSyncControlRepo.start.mockResolvedValue(undefined as never);
    productSyncControlRepo.complete.mockResolvedValue(undefined as never);
    productSyncControlRepo.unlock.mockResolvedValue(undefined as never);
    productSyncControlRepo.fail.mockResolvedValue(undefined as never);
    productSyncControlRepo.updateCursor.mockResolvedValue(undefined as never);
    productSyncControlRepo.finish.mockResolvedValue(undefined as never);
    rateLimit.limitOrWait.mockResolvedValue(undefined as never);
  });

  it('lança NotFoundException quando não existe controle de sincronização', async () => {
    productSyncControlRepo.findByShopId.mockResolvedValue(null);

    await expect(service.syncProducts('u1', 'shop-1')).rejects.toThrow(NotFoundException);
  });

  it('lança ConflictException quando a sincronização já está em andamento', async () => {
    productSyncControlRepo.findByShopId.mockResolvedValue({ ...syncControl, locked_at: new Date() });

    await expect(service.syncProducts('u1', 'shop-1')).rejects.toThrow(ConflictException);
    expect(productSyncControlRepo.start).not.toHaveBeenCalled();
  });

  it('sincroniza uma página e finaliza com sucesso', async () => {
    productService.getProductsList.mockResolvedValue({
      item: [{ item_id: 1 }],
      has_next_page: false,
      next_offset: 0,
    } as never);
    productService.getProductsInfo.mockResolvedValue({
      item_list: [
        {
          item_id: 1,
          category_id: 10,
          item_name: 'Produto A',
          item_sku: 'SKU-1',
          image: { image_url_list: ['https://img'] },
          stock_info_v2: { summary_info: { total_available_stock: 5 } },
          price_info: [{ current_price: 19.9 }],
          create_time: 1000,
          update_time: 2000,
        },
      ],
    } as never);
    productService.upsertBulkProducts.mockResolvedValue({ products_inserted: 1, products_updated: 0 } as never);

    const result = await service.syncProducts('u1', 'shop-1');

    expect(productSyncControlRepo.start).toHaveBeenCalledWith('sync-1');
    expect(productSyncControlRepo.complete).toHaveBeenCalledWith('sync-1');
    expect(productSyncControlRepo.unlock).toHaveBeenCalledWith('sync-1');
    expect(productService.upsertBulkProducts).toHaveBeenCalledWith({
      shopId: 'shop-1',
      products: [
        expect.objectContaining({
          marketplace: MarketplaceType.SHOPEE,
          name: 'Produto A',
          sku: 'SKU-1',
          external_id: '1',
          stock: 5,
          sale_price_cents: 1990,
        }),
      ],
    });
    expect(result).toEqual(expect.objectContaining({ shop: 'shop-1', products_inserted: 1, products_updated: 0 }));
  });

  it('avança o cursor e processa mais de uma página', async () => {
    productService.getProductsList
      .mockResolvedValueOnce({
        item: [{ item_id: 1 }],
        has_next_page: true,
        next_offset: 10,
      } as never)
      .mockResolvedValueOnce({
        item: [{ item_id: 2 }],
        has_next_page: false,
        next_offset: 0,
      } as never);
    productService.getProductsInfo.mockResolvedValue({
      item_list: [
        {
          item_id: 1,
          category_id: 10,
          item_name: 'Produto A',
          item_sku: 'SKU-1',
          image: { image_url_list: ['https://img'] },
          stock_info_v2: { summary_info: { total_available_stock: 1 } },
          price_info: [{ current_price: 10 }],
          create_time: 1000,
          update_time: 2000,
        },
      ],
    } as never);
    productService.upsertBulkProducts.mockResolvedValue({ products_inserted: 1, products_updated: 1 } as never);

    await service.syncProducts('u1', 'shop-1');

    expect(productSyncControlRepo.updateCursor).toHaveBeenCalledWith('sync-1', 10);
    expect(productSyncControlRepo.finish).toHaveBeenCalledWith('sync-1', expect.any(Date));
  });

  it('registra falha e relança o erro quando a sincronização falha', async () => {
    productService.getProductsList.mockRejectedValue(new Error('Shopee indisponível'));

    await expect(service.syncProducts('u1', 'shop-1')).rejects.toThrow('Shopee indisponível');
    expect(productSyncControlRepo.fail).toHaveBeenCalledWith('sync-1', 'Shopee indisponível');
    expect(productSyncControlRepo.unlock).toHaveBeenCalledWith('sync-1');
  });

  it('não relança erro quando falha ao liberar o lock', async () => {
    productService.getProductsList.mockResolvedValue({
      item: [{ item_id: 1 }],
      has_next_page: false,
      next_offset: 0,
    } as never);
    productService.getProductsInfo.mockResolvedValue({ item_list: [] } as never);
    productSyncControlRepo.unlock.mockRejectedValue(new Error('redis down'));

    await expect(service.syncProducts('u1', 'shop-1')).resolves.toBeDefined();
  });

  it('createInitialRecord delega ao repositório', async () => {
    const data = { shop_id: 'shop-1', marketplace: MarketplaceType.SHOPEE } as never;
    productSyncControlRepo.create.mockResolvedValue(syncControl);

    await expect(service.createInitialRecord(data)).resolves.toEqual(syncControl);
    expect(productSyncControlRepo.create).toHaveBeenCalledWith(data);
  });
});
