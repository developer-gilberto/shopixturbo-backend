import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetShopDTO, GetShopInfoResponseDTO, GetShopProfileResponseDTO } from './shops.dto';
import { ShopsService } from './shops.service';

@Controller('shops')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ShopsController {
  constructor(private readonly shopService: ShopsService) {}

  @Get('info/:shop_id')
  @ApiResponse({ status: HttpStatus.OK, type: GetShopInfoResponseDTO })
  async getShopInfoById(@Param() data: GetShopDTO) {
    const shopData = await this.shopService.getShopInfo(data.shop_id);
    return {
      shop_name: shopData.shop_name,
      region: shopData.region,
      status: shopData.status,
      auth_time: shopData.auth_time,
      expire_time: shopData.expire_time,
    };
  }

  @Get('profile/:shop_id')
  @ApiResponse({ status: HttpStatus.OK, type: GetShopProfileResponseDTO })
  async getShopProfileById(@Param() data: GetShopDTO) {
    const shopData = await this.shopService.getShopProfile(data.shop_id);
    return {
      shop_name: shopData.shop_name,
      description: shopData.description,
      shop_logo: shopData.shop_logo,
      invoice_issuer: shopData.invoice_issuer,
    };
  }
}
