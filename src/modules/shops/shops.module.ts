import { Module } from '@nestjs/common';
import { ShopeeAuthModule } from '../integrations/shopee/auth/shopee-auth.module';
import { ShopsRepository } from './shops.repository';
import { ShopsService } from './shops.service';

@Module({
  imports: [ShopeeAuthModule],
  providers: [ShopsRepository, ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
