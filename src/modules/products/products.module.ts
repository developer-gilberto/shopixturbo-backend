import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ShopeeAuthModule } from '../integrations/shopee/auth/shopee-auth.module';
import { ShopeeTokenModule } from '../integrations/shopee/token/shopee-token.module';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [ShopeeAuthModule, ShopeeTokenModule],
  controllers: [ProductsController],
  providers: [JwtService, ProductsService, ProductsRepository],
})
export class ProductsModule {}
