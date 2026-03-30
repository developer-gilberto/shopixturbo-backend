import { Module } from '@nestjs/common';
import { ShopeeAuthService } from './shopee-auth.service';

@Module({
  providers: [ShopeeAuthService],
  exports: [ShopeeAuthService],
})
export class ShopeeAuthModule {}
