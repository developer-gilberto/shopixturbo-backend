import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { env } from 'src/configs';
import type { SignInDTO, SignUpDTO } from './auth.dto';
import { AuthService } from './auth.service';
import { VerifyEmailStatus } from './verify-email-status.enum';

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
  async verifyEmail(@Query('token') token: string, @Res() response: Response) {
    const emailVerificationStatus = await this.authService.verifyEmail(token);

    const redirectMap: Record<VerifyEmailStatus, string> = {
      [VerifyEmailStatus.VERIFIED_EMAIL]: `${env.FRONTEND_URL}/signin?email-verification-status=${VerifyEmailStatus.VERIFIED_EMAIL}`,
      [VerifyEmailStatus.INVALID_TOKEN]: `${env.FRONTEND_URL}/signin?email-verification-status=${VerifyEmailStatus.INVALID_TOKEN}`,
      [VerifyEmailStatus.EXPIRED_TOKEN]: `${env.FRONTEND_URL}/signin?email-verification-status=${VerifyEmailStatus.EXPIRED_TOKEN}`,
    };

    return response.redirect(HttpStatus.SEE_OTHER, redirectMap[emailVerificationStatus]);
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(@Body('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }
}
