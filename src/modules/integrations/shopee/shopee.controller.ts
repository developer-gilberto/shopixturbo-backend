import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { TokenPayload } from 'src/common/types/token-payload.type';
import { CallbackGetTokenDTO } from './shopee.dto';
import { ShopeeService } from './shopee.service';

@Controller('integration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ShopeeController {
  constructor(private readonly shopeeService: ShopeeService) {}

  @Get('shopee/auth-url')
  async getAuthUrl() {
    const authUrl = this.shopeeService.getAuthUrl();
    return { auth_url: authUrl };
  }

  @Get('shopee/callback/access-token')
  async handleCallbackGetToken(@CurrentUser() user: TokenPayload, @Query() data: CallbackGetTokenDTO) {
    return await this.shopeeService.handleCallback(user.id, data);
  }
}
