import { Module } from '@nestjs/common';
import { ShopeeAuthModule } from '../integrations/shopee/auth/shopee-auth.module';
import { ShopeeTokenModule } from '../integrations/shopee/token/shopee-token.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { OrdersReportController } from './orders-report.controller';
import { OrdersReportService } from './orders-report.service';
import { OrdersReportCalculator } from './orders-report-calculator.service';

@Module({
  imports: [ShopeeAuthModule, ShopeeTokenModule, OrdersModule, ProductsModule],
  controllers: [OrdersReportController],
  providers: [OrdersReportService, OrdersReportCalculator],
})
export class OrdersReportModule {}
