import { Controller, Get, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { TokenPayload } from 'src/common/types/token-payload.type';
import { GetShopDTO } from '../shops/shops.dto';
import { OrderListResponseDTO, OrdersDetailsDTO, OrdersListDTO } from './orders.dto';
import { OrdersService } from './orders.service';
import { OrderDetailListResponseDTO } from './orders-details.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('list/:shop_id')
  @ApiResponse({ status: HttpStatus.OK, type: OrderListResponseDTO })
  async getOrderList(@CurrentUser() user: TokenPayload, @Param() param: GetShopDTO, @Query() query: OrdersListDTO) {
    return await this.ordersService.getOrderList({
      userId: user.id,
      shopId: param.shop_id,
      offset: query.offset,
      page_size: query.page_size,
      interval_days: query.interval_days,
      order_status: query.order_status,
      time_range_field: query.time_range_field,
    });
  }

  @Get('details/:shop_id')
  @ApiResponse({ status: HttpStatus.OK, type: OrderDetailListResponseDTO })
  async getOrderDetails(
    @CurrentUser() user: TokenPayload,
    @Param() param: GetShopDTO,
    @Query() query: OrdersDetailsDTO,
  ) {
    return await this.ordersService.getOrderDetails({
      userId: user.id,
      shopId: param.shop_id,
      order_id_list: query.order_id_list,
    });
  }
}
