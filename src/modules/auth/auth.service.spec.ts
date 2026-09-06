import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MailProducer } from '../mail/mail.producer';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { VerifyEmailStatus } from './verify-email-status.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userService: jest.Mocked<UsersService>;
  let mailProducer: jest.Mocked<MailProducer>;

  const storedUser = {
    id: 'user-1',
    name: 'Ana',
    email: 'ana@example.com',
    password: 'hash-123',
    role: 'USER',
    is_email_verified: true,
    email_verification_token_expires_at: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: jest.fn() } },
        {
          provide: UsersService,
          useValue: {
            checkEmailAvailability: jest.fn(),
            create: jest.fn(),
            getByVerificationToken: jest.fn(),
            activateAccount: jest.fn(),
            getByEmail: jest.fn(),
            updateEmailVerificationToken: jest.fn(),
            getById: jest.fn(),
          },
        },
        { provide: MailProducer, useValue: { sendVerificationEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(JwtService);
    userService = module.get(UsersService);
    mailProducer = module.get(MailProducer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('cria o usuário e envia o email de verificação quando o email está disponível', async () => {
      userService.checkEmailAvailability.mockResolvedValue(true);
      mockHash.mockResolvedValue('hashed' as never);

      const result = await service.signup({ email: 'nova@example.com', password: '123456' } as never);

      expect(userService.checkEmailAvailability).toHaveBeenCalledWith('nova@example.com');
      expect(userService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'nova@example.com', password: 'hashed', is_email_verified: false }),
      );
      expect(mailProducer.sendVerificationEmail).toHaveBeenCalledWith('nova@example.com', expect.any(String));
      expect(result.message).toContain('nova@example.com');
    });

    it('lança ConflictException quando o email não está disponível', async () => {
      userService.checkEmailAvailability.mockResolvedValue(false);

      await expect(service.signup({ email: 'a@b.com', password: '123' } as never)).rejects.toThrow(ConflictException);
      expect(userService.create).not.toHaveBeenCalled();
    });
  });

  describe('signin', () => {
    it('lança UnauthorizedException quando o usuário não existe', async () => {
      userService.getByEmail.mockResolvedValue(null);
      mockCompare.mockResolvedValue(false as never);

      await expect(service.signin({ email: 'x@y.com', password: '123' } as never)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockCompare).toHaveBeenCalled();
    });

    it('lança UnauthorizedException quando a senha é inválida', async () => {
      userService.getByEmail.mockResolvedValue(storedUser as never);
      mockCompare.mockResolvedValue(false as never);

      await expect(service.signin({ email: 'ana@example.com', password: 'errada' } as never)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança ForbiddenException quando o email não foi verificado', async () => {
      userService.getByEmail.mockResolvedValue({ ...storedUser, is_email_verified: false } as never);
      mockCompare.mockResolvedValue(true as never);

      await expect(service.signin({ email: 'ana@example.com', password: '123456' } as never)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('gera e retorna o token quando as credenciais são válidas', async () => {
      userService.getByEmail.mockResolvedValue(storedUser as never);
      mockCompare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('jwt-token' as never);

      const result = await service.signin({ email: 'ana@example.com', password: '123456' } as never);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1', email: 'ana@example.com', is_email_verified: true }),
      );
      expect(result).toEqual({ user_auth_token: 'jwt-token' });
    });
  });

  describe('verifyEmail', () => {
    it('retorna INVALID_TOKEN quando não há usuário com o token', async () => {
      userService.getByVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail('token')).resolves.toBe(VerifyEmailStatus.INVALID_TOKEN);
    });

    it('retorna INVALID_TOKEN quando não há data de expiração', async () => {
      userService.getByVerificationToken.mockResolvedValue({
        ...storedUser,
        email_verification_token_expires_at: null,
      } as never);

      await expect(service.verifyEmail('token')).resolves.toBe(VerifyEmailStatus.INVALID_TOKEN);
    });

    it('retorna EXPIRED_TOKEN quando o token expirou', async () => {
      userService.getByVerificationToken.mockResolvedValue({
        ...storedUser,
        email_verification_token_expires_at: new Date(Date.now() - 60_000),
      } as never);

      await expect(service.verifyEmail('token')).resolves.toBe(VerifyEmailStatus.EXPIRED_TOKEN);
    });

    it('ativa a conta e retorna VERIFIED_EMAIL quando o token é válido', async () => {
      userService.getByVerificationToken.mockResolvedValue({
        ...storedUser,
        email_verification_token_expires_at: new Date(Date.now() + 60_000),
      } as never);

      const result = await service.verifyEmail('token');

      expect(userService.activateAccount).toHaveBeenCalledWith('user-1');
      expect(result).toBe(VerifyEmailStatus.VERIFIED_EMAIL);
    });
  });

  describe('resendVerificationEmail', () => {
    it('retorna mensagem genérica quando o email não está cadastrado', async () => {
      userService.getByEmail.mockResolvedValue(null);

      const result = await service.resendVerificationEmail('nao@existe.com');

      expect(result.message).toBe('Se o email estiver cadastrado, você receberá um novo link de verificação.');
      expect(mailProducer.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('retorna mensagem de já verificado quando o email foi verificado', async () => {
      userService.getByEmail.mockResolvedValue(storedUser as never);

      const result = await service.resendVerificationEmail('ana@example.com');

      expect(result.message).toBe('Este email já foi verificado.');
      expect(mailProducer.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('atualiza o token e reenvia o email quando o email existe e não foi verificado', async () => {
      userService.getByEmail.mockResolvedValue({ ...storedUser, is_email_verified: false } as never);

      const result = await service.resendVerificationEmail('ana@example.com');

      expect(userService.updateEmailVerificationToken).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ token: expect.any(String) }),
      );
      expect(mailProducer.sendVerificationEmail).toHaveBeenCalledWith('ana@example.com', expect.any(String));
      expect(result.message).toBe('Se o email estiver cadastrado, você receberá um novo link de verificação.');
    });
  });

  describe('me', () => {
    it('retorna o usuário pelo id', async () => {
      userService.getById.mockResolvedValue(storedUser as never);

      await expect(service.me('user-1')).resolves.toEqual(storedUser);
      expect(userService.getById).toHaveBeenCalledWith('user-1');
    });
  });
});
