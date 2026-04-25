import { Controller, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { DateRangeValidationPipe } from 'src/common/pipes/date-range-validation.pipe';
import type { TokenPayload } from 'src/common/types/token-payload.type';
import { GetProductListQueryDTO } from '../products/products.dto';
import { GetShopDTO } from '../shops/shops.dto';
import { ProductsSyncService } from './products-sync.service';

@Controller('sync/products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ProductsSyncController {
  constructor(private readonly productSyncService: ProductsSyncService) {}

  @Post('/:shop_id')
  async syncProducts(
    @CurrentUser() user: TokenPayload,
    @Param() param: GetShopDTO,
    @Query(new DateRangeValidationPipe()) query: GetProductListQueryDTO,
  ) {
    return await this.productSyncService.syncProducts(
      user.id,
      param.shop_id,
      query.update_time_from,
      query.update_time_to,
    );
  }
}
