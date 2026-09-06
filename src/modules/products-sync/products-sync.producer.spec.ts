import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { constants } from 'src/configs/constants.config';
import { ProductsSyncProducer } from './products-sync.producer';

describe('ProductsSyncProducer', () => {
  let producer: ProductsSyncProducer;
  let productsSyncQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    productsSyncQueue = { add: jest.fn() } as unknown as jest.Mocked<Queue>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsSyncProducer,
        { provide: getQueueToken(constants.PRODUCTS_SYNC_QUEUE), useValue: productsSyncQueue },
      ],
    }).compile();

    producer = module.get(ProductsSyncProducer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncProducts', () => {
    it('deve adicionar job na fila com os dados corretos', async () => {
      productsSyncQueue.add.mockResolvedValue({} as never);

      await producer.syncProducts('user-1', 'shop-1');

      expect(productsSyncQueue.add).toHaveBeenCalledTimes(1);
      expect(productsSyncQueue.add).toHaveBeenCalledWith(
        constants.PRODUCTS_SYNC_JOB,
        { userId: 'user-1', shopId: 'shop-1' },
        {
          jobId: 'products-sync-shop-shop-1-user-user-1',
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    });

    it('deve propagar erro quando a fila falha', async () => {
      productsSyncQueue.add.mockRejectedValue(new Error('Queue down'));

      await expect(producer.syncProducts('user-1', 'shop-1')).rejects.toThrow('Queue down');
    });
  });
});
