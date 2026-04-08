import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetShopDTO } from './shops.dto';
import { ShopsService } from './shops.service';

@Controller('shops')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ShopsController {
  constructor(private readonly shopService: ShopsService) {}

  @Get('info/:shop_id')
  async getShopInfoById(@Param() data: GetShopDTO) {
    return await this.shopService.getShopInfo(data.shop_id);
  }

  @Get('profile/:shop_id')
  async getShopProfileById(@Param() data: GetShopDTO) {
    return await this.shopService.getShopProfile(data.shop_id);
  }
}
