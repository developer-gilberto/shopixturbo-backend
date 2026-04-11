import { Module } from '@nestjs/common';
import { EncryptionModule } from 'src/common/encryption/encryption.module';
import { ShopeeAuthModule } from '../auth/shopee-auth.module';
import { ShopeeTokenRepository } from './shopee-token.repository';
import { ShopeeTokenService } from './shopee-token.service';

@Module({
  imports: [EncryptionModule, ShopeeAuthModule],
  providers: [ShopeeTokenService, ShopeeTokenRepository],
  exports: [ShopeeTokenService],
})
export class ShopeeTokenModule {}
