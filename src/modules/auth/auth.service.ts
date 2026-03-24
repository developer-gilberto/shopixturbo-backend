import * as crypto from 'node:crypto';
import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TokenPayload } from 'src/common/types/token-payload.type';
import { Prisma } from 'src/generated/prisma/client';
import { constants } from '../../configs';
import { MailProducer } from '../mail/mail.producer';
import { UsersService } from '../users/users.service';
import { SignInDTO, SignUpDTO } from './auth.dto';
import { VerifyEmailStatus } from './verify-email-status.enum';

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
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

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

  async verifyEmail(token: string): Promise<VerifyEmailStatus> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userService.getByVerificationToken(tokenHash);

    if (!user) {
      return VerifyEmailStatus.INVALID_TOKEN;
    }

    if (!user.email_verification_token_expires_at) {
      return VerifyEmailStatus.INVALID_TOKEN;
    }

    if (user.email_verification_token_expires_at < new Date()) {
      return VerifyEmailStatus.EXPIRED_TOKEN;
    }

    await this.userService.activateAccount(user.id);

    return VerifyEmailStatus.VERIFIED_EMAIL;
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userService.getByEmail(email);

    if (!user) {
      return {
        message: 'Se o email estiver cadastrado, você receberá um novo link de verificação.',
      };
    }

    if (user.is_email_verified) {
      return {
        message: 'Este email já foi verificado.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await this.userService.updateEmailVerificationToken(user.id, {
      token: tokenHash,
      expiresAt,
    });

    await this.mailProducer.sendVerificationEmail(user.email, rawToken);

    return {
      message: 'Se o email estiver cadastrado, você receberá um novo link de verificação.',
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

    const payload = {
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
      role: storedUser.role,
      is_email_verified: storedUser.is_email_verified,
    };

    const token = this.jwtService.sign<TokenPayload>(payload);

    return { user_auth_token: token };
  }

  async me(userId: string) {
    return await this.userService.getById(userId);
  }
}
