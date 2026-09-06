import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { constants } from 'src/configs/constants.config';
import { ProductsSyncProcessor } from './products-sync.processor';
import { ProductsSyncService } from './products-sync.service';

describe('ProductsSyncProcessor', () => {
  let processor: ProductsSyncProcessor;
  let productsSyncService: jest.Mocked<ProductsSyncService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsSyncProcessor,
        {
          provide: ProductsSyncService,
          useValue: { syncProducts: jest.fn() },
        },
      ],
    }).compile();

    processor = module.get(ProductsSyncProcessor);
    productsSyncService = module.get(ProductsSyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('deve processar job de sincronização de produtos', async () => {
      productsSyncService.syncProducts.mockResolvedValue(undefined as never);

      const job = {
        name: constants.PRODUCTS_SYNC_JOB,
        data: { userId: 'user-1', shopId: 'shop-1' },
        attemptsMade: 0,
      } as unknown as Job<{ userId: string; shopId: string }>;

      await processor.process(job);

      expect(productsSyncService.syncProducts).toHaveBeenCalledWith('user-1', 'shop-1');
      expect(productsSyncService.syncProducts).toHaveBeenCalledTimes(1);
    });

    it('deve repassar o erro quando syncProducts falha', async () => {
      productsSyncService.syncProducts.mockRejectedValue(new Error('Shopee indisponível'));

      const job = {
        name: constants.PRODUCTS_SYNC_JOB,
        data: { userId: 'user-1', shopId: 'shop-1' },
        attemptsMade: 1,
      } as unknown as Job<{ userId: string; shopId: string }>;

      await expect(processor.process(job)).rejects.toThrow('Shopee indisponível');
    });

    it('deve logar o número de tentativas corretamente', async () => {
      productsSyncService.syncProducts.mockResolvedValue(undefined as never);

      const job = {
        name: constants.PRODUCTS_SYNC_JOB,
        data: { userId: 'user-1', shopId: 'shop-1' },
        attemptsMade: 2,
      } as unknown as Job<{ userId: string; shopId: string }>;

      await processor.process(job);

      expect(productsSyncService.syncProducts).toHaveBeenCalledWith('user-1', 'shop-1');
    });
  });
});
