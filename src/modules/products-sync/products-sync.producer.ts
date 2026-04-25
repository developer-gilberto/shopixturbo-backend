import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { constants } from 'src/configs/constants.config';

@Injectable()
export class ProductsSyncProducer {
  constructor(@InjectQueue(constants.PRODUCTS_SYNC_QUEUE) private readonly productsSyncQueue: Queue) {}

  async syncProducts(userId: string, shopId: string): Promise<void> {
    await this.productsSyncQueue.add(
      constants.PRODUCTS_SYNC_JOB,
      { userId, shopId },
      {
        jobId: `products-sync-shop-${shopId}-user-${userId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
