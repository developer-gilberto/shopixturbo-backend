import { Module } from '@nestjs/common';
import { EncryptionModule } from 'src/common/encryption/encryption.module';
import { ShopsModule } from 'src/modules/shops/shops.module';
import { ShopeeAuthModule } from './auth/shopee-auth.module';
import { ShopeeController } from './shopee.controller';
import { ShopeeService } from './shopee.service';

@Module({
  imports: [EncryptionModule, ShopeeAuthModule, ShopsModule],
  controllers: [ShopeeController],
  providers: [ShopeeService],
  exports: [ShopeeService],
})
export class ShopeeModule {}
