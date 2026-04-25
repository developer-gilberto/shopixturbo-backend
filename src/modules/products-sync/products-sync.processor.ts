import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { constants } from 'src/configs/constants.config';
import { ProductsSyncService } from './products-sync.service';

@Processor(constants.PRODUCTS_SYNC_QUEUE, {
  concurrency: 5,
})
export class ProductsSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductsSyncProcessor.name);

  constructor(private readonly productsSyncService: ProductsSyncService) {
    super();
  }

  async process(job: Job<{ userId: string; shopId: string }>) {
    this.logger.log(
      `Processando sincronização dos produtos para o shop: "${job.data.shopId}" e user: "${job.data.userId}" (${job.attemptsMade + 1}° tentativa)`,
    );
    await this.productsSyncService.syncProducts(job.data.userId, job.data.shopId);
  }
}
