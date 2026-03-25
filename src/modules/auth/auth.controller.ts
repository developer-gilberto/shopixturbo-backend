import { Body, Controller, Get, HttpStatus, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { TokenPayload } from 'src/common/types/token-payload.type';
import { env } from 'src/configs/env.config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserResponseDTO } from '../users/users.dto';
import {
  EmailDTO,
  ResendVerifyEmailResponseDTO,
  SignInDTO,
  SignInResponseDTO,
  SignUpDTO,
  SignUpResponseDTO,
  TokenDTO,
  VerifyEmailResponseDTO,
} from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiResponse({ status: HttpStatus.CREATED, type: SignUpResponseDTO })
  async signUp(@Body() data: SignUpDTO) {
    return await this.authService.signup(data);
  }

  @Post('signin')
  @ApiResponse({ status: HttpStatus.OK, type: SignInResponseDTO })
  async signIn(@Body() data: SignInDTO) {
    return await this.authService.signin(data);
  }

  @Get('verify-email')
  @ApiResponse(VerifyEmailResponseDTO)
  async verifyEmail(@Query() query: TokenDTO, @Res() response: Response) {
    const emailStatus = await this.authService.verifyEmail(query.token);

    const redirectUrl = `${env.FRONTEND_URL}/verification/email?status=${emailStatus}`;

    return response.redirect(HttpStatus.SEE_OTHER, redirectUrl);
  }

  @Post('resend-verification-email')
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: ResendVerifyEmailResponseDTO })
  async resendVerificationEmail(@Body() body: EmailDTO) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDTO })
  async me(@CurrentUser() user: TokenPayload): Promise<UserResponseDTO> {
    return this.authService.me(user.id);
  }
}
