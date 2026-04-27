import { Module } from '@nestjs/common';
import { ShopeeAuthModule } from '../integrations/shopee/auth/shopee-auth.module';
import { ShopeeTokenModule } from '../integrations/shopee/token/shopee-token.module';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [ShopeeAuthModule, ShopeeTokenModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
