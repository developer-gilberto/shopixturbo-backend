import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { SignUpDTO } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() data: SignUpDTO) {
    return await this.authService.signup(data);
  }
}
