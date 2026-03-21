import * as crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from 'src/generated/prisma/client';
import { constants } from '../../configs';
import { MailProducer } from '../mail/mail.producer';
import { UsersService } from '../users/users.service';
import { SignInDTO, SignUpDTO } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailProducer: MailProducer,
  ) {}

  async signup(data: SignUpDTO) {
    const emailAvailable = await this.userService.checkEmailAvailability(data.email);

    if (!emailAvailable) {
      throw new ConflictException('Tente criar sua conta com um email diferente.');
    }

    const passwordHash = await bcrypt.hash(data.password, constants.SALT_PASSWORD);

    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h

    const newUser: Prisma.UserCreateInput = {
      ...data,
      password: passwordHash,
      is_email_verified: false,
      email_verification_token: tokenHash,
      email_verification_token_expires_at: tokenExpiresAt,
    };

    await this.userService.create(newUser);

    await this.mailProducer.sendVerificationEmail(data.email, rawToken);

    return {
      message: `Enviamos um email para ${data.email}. Verifique sua caixa de entrada para ativar sua conta.`,
    };
  }

  async verifyEmail(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userService.getByVerificationToken(tokenHash);

    if (!user) {
      throw new BadRequestException('Token inválido.');
    }

    if (!user.email_verification_token_expires_at) {
      throw new BadRequestException('Token inválido ou já utilizado.');
    }

    if (user.email_verification_token_expires_at < new Date()) {
      throw new BadRequestException('Token expirado. Solicite um novo email de verificação.');
    }

    await this.userService.activateAccount(user.id);

    return {
      message: 'Email verificado com sucesso! Você já pode fazer login.',
    };
  }

  async signin(data: SignInDTO) {
    const storedUser = await this.userService.getByEmail(data.email);

    if (!storedUser) {
      await bcrypt.compare(data.password, '$2b$10$invalidhashfortimingprotection00000000000000');
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isValidPassword = await bcrypt.compare(data.password, storedUser.password);
    if (!isValidPassword) throw new UnauthorizedException('Credenciais inválidas.');

    if (!storedUser.is_email_verified) {
      throw new ForbiddenException('É necessário verificar seu email para fazer login.');
    }

    const payload = { user_id: storedUser.id, user_name: storedUser.name };
    const token = this.jwtService.sign(payload);

    return { user_auth_token: token };
  }
}
