import { Module } from '@nestjs/common';
import { ShopeeAuthModule } from '../integrations/shopee/auth/shopee-auth.module';
import { ShopeeTokenModule } from '../integrations/shopee/token/shopee-token.module';
import { ShopsController } from './shops.controller';
import { ShopsRepository } from './shops.repository';
import { ShopsService } from './shops.service';

@Module({
  imports: [ShopeeAuthModule, ShopeeTokenModule],
  controllers: [ShopsController],
  providers: [ShopsService, ShopsRepository],
  exports: [ShopsService],
})
export class ShopsModule {}
