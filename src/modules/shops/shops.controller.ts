import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { TokenPayload } from 'src/common/types/token-payload.type';
import { GetShopDTO, GetShopInfoResponseDTO, GetShopProfileResponseDTO, ShopFullResponseDTO } from './shops.dto';
import { ShopsService } from './shops.service';

@Controller('shops')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ShopsController {
  constructor(private readonly shopService: ShopsService) {}

  @Get('info/:shop_id')
  @ApiResponse({ status: HttpStatus.OK, type: GetShopInfoResponseDTO })
  async getShopInfoById(@CurrentUser() user: TokenPayload, @Param() data: GetShopDTO) {
    return await this.shopService.getShopInfo(user.id, data.shop_id);
  }

  @Get('profile/:shop_id')
  @ApiResponse({ status: HttpStatus.OK, type: GetShopProfileResponseDTO })
  async getShopProfileById(@CurrentUser() user: TokenPayload, @Param() data: GetShopDTO) {
    return await this.shopService.getShopProfile(user.id, data.shop_id);
  }

  @Get('full/:shop_id')
  @ApiResponse({ status: HttpStatus.OK, type: ShopFullResponseDTO })
  async getShopFullById(@CurrentUser() user: TokenPayload, @Param() data: GetShopDTO) {
    return await this.shopService.getShopFullByIdAndUserId(user.id, data.shop_id);
  }
}
