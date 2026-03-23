import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { env } from 'src/configs';
import { EmailDTO, SignInDTO, SignUpDTO, TokenDTO } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() data: SignUpDTO) {
    return await this.authService.signup(data);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() data: SignInDTO) {
    return await this.authService.signin(data);
  }

  @Get('verify-email')
  async verifyEmail(@Query() query: TokenDTO, @Res() response: Response) {
    const emailStatus = await this.authService.verifyEmail(query.token);

    const redirectUrl = `${env.FRONTEND_URL}/verification/email?status=${emailStatus}`;

    return response.redirect(HttpStatus.SEE_OTHER, redirectUrl);
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() body: EmailDTO) {
    return this.authService.resendVerificationEmail(body.email);
  }
}
