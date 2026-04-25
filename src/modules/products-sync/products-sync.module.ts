import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { constants } from 'src/configs/constants.config';
import { ProductsModule } from '../products/products.module';
import { ProductsSyncController } from './products-sync.controller';
import { ProductsSyncProcessor } from './products-sync.processor';
import { ProductsSyncProducer } from './products-sync.producer';
import { ProductsSyncService } from './products-sync.service';
import { ProductsSyncControlRepository } from './products-sync-control.repository';

@Module({
  imports: [
    BullModule.registerQueue({
      name: constants.PRODUCTS_SYNC_QUEUE,
    }),
    ProductsModule,
  ],
  providers: [ProductsSyncProcessor, ProductsSyncProducer, ProductsSyncService, ProductsSyncControlRepository],
  exports: [ProductsSyncProducer, ProductsSyncService],
  controllers: [ProductsSyncController],
})
export class ProductsSyncModule {}
