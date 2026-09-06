import { Controller, Get, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { TokenPayload } from 'src/common/types/token-payload.type';
import { OrdersListDTO } from '../orders/orders.dto';
import { GetShopDTO } from '../shops/shops.dto';
import { EscrowDetailResponseDTO, OrderEscrowDetailsDTO, OrdersReportResponseDTO } from './orders-report.dto';
import { OrdersReportService } from './orders-report.service';

@Controller('report')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class OrdersReportController {
  constructor(private readonly ordersReportService: OrdersReportService) {}

  @Get('orders/:shop_id')
  @ApiResponse({ status: HttpStatus.OK, type: OrdersReportResponseDTO })
  async getOrdersReport(@CurrentUser() user: TokenPayload, @Param() param: GetShopDTO, @Query() query: OrdersListDTO) {
    return await this.ordersReportService.getOrdersReport({
      userId: user.id,
      shopId: param.shop_id,
      offset: query.offset,
      page_size: query.page_size,
      interval_days: query.interval_days,
      order_status: query.order_status,
      time_range_field: query.time_range_field,
    });
  }

  @Get('orders/payment/escrow_detail_batch/:shop_id')
  @ApiResponse({ status: HttpStatus.OK, type: [EscrowDetailResponseDTO] })
  async getEscrowDetailsBatch(
    @CurrentUser() user: TokenPayload,
    @Param() param: GetShopDTO,
    @Query() query: OrderEscrowDetailsDTO,
  ) {
    return await this.ordersReportService.getEscrowDetailsBatch({
      userId: user.id,
      shopId: param.shop_id,
      order_ids: query.order_sn,
    });
  }
}
