import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { TokenPayload } from 'src/common/types/token-payload.type';
import { AuthUrlResponseDTO, CallbackGetTokenDTO, CallbackGetTokenResponseDTO } from './shopee.dto';
import { ShopeeService } from './shopee.service';

@Controller('integration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ShopeeController {
  constructor(private readonly shopeeService: ShopeeService) {}

  @Get('shopee/auth-url')
  @ApiResponse({
    status: HttpStatus.OK,
    type: AuthUrlResponseDTO,
    description: 'Gera a URL de autorização da Shopee para conectar uma loja',
  })
  async getAuthUrl() {
    const authUrl = this.shopeeService.getAuthUrl();
    return { auth_url: authUrl };
  }

  @Get('shopee/callback/access-token')
  @ApiResponse({
    status: HttpStatus.OK,
    type: CallbackGetTokenResponseDTO,
    description: 'Processa o callback de autorização e conecta a loja',
  })
  async handleCallbackGetToken(@CurrentUser() user: TokenPayload, @Query() data: CallbackGetTokenDTO) {
    return await this.shopeeService.handleCallback(user.id, data);
  }
}
