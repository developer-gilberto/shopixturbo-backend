import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cache } from 'src/configs/cache.config';
import { PrismaService } from 'src/database/prisma.service';
import { RedisService } from 'src/database/redis.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let redis: {
    delete: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    redis = { delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    repository = module.get(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getByEmail', () => {
    it('deve retornar o usuário quando encontrado', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.getByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('deve retornar null quando usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.getByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('deve lançar InternalServerErrorException quando prisma falha', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('db down'));

      await expect(repository.getByEmail('test@example.com')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getById', () => {
    it('deve retornar o usuário sem campos sensíveis', async () => {
      const mockUser = { id: 'u1', name: 'Test' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.getById('u1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
        omit: {
          password: true,
          email_verification_token: true,
          email_verification_token_expires_at: true,
        },
      });
    });

    it('deve retornar null quando usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.getById('notfound');

      expect(result).toBeNull();
    });

    it('deve lançar InternalServerErrorException quando prisma falha', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('db down'));

      await expect(repository.getById('u1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('create', () => {
    it('deve criar um usuário e retornar sem campos sensíveis', async () => {
      const mockUser = { id: 'u1', name: 'Test', email: 'test@example.com' };
      prisma.user.create.mockResolvedValue(mockUser);

      const data = { name: 'Test', email: 'test@example.com', password: 'hash' } as never;

      const result = await repository.create(data);

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data,
        omit: {
          password: true,
          email_verification_token: true,
          email_verification_token_expires_at: true,
        },
      });
    });

    it('deve lançar InternalServerErrorException quando prisma falha', async () => {
      prisma.user.create.mockRejectedValue(new Error('db down'));
      const data = { email: 'test@example.com' } as never;

      await expect(repository.create(data)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getByVerificationToken', () => {
    it('deve retornar o usuário pelo token de verificação', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com' };
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repository.getByVerificationToken('token-hash');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email_verification_token: 'token-hash' },
        omit: { password: true },
      });
    });

    it('deve retornar null quando token não existe', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.getByVerificationToken('invalid-token');

      expect(result).toBeNull();
    });

    it('deve propagar erro quando prisma falha', async () => {
      prisma.user.findFirst.mockRejectedValue(new Error('db down'));

      await expect(repository.getByVerificationToken('token')).rejects.toThrow('db down');
    });
  });

  describe('updateEmailStatus', () => {
    it('deve atualizar is_email_verified e limpar cache', async () => {
      const mockUser = { id: 'u1', is_email_verified: true };
      prisma.user.update.mockResolvedValue(mockUser);
      redis.delete.mockResolvedValue(undefined);

      const result = await repository.updateEmailStatus('u1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          is_email_verified: true,
          email_verification_token: null,
          email_verification_token_expires_at: null,
        },
        omit: {
          password: true,
          email_verification_token: true,
          email_verification_token_expires_at: true,
        },
      });
      expect(redis.delete).toHaveBeenCalledWith(cache.userMeKey('u1'));
    });

    it('deve lançar InternalServerErrorException quando prisma falha', async () => {
      prisma.user.update.mockRejectedValue(new Error('db down'));

      await expect(repository.updateEmailStatus('u1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateVerificationToken', () => {
    it('deve atualizar o token de verificação', async () => {
      const mockUser = { id: 'u1' };
      prisma.user.update.mockResolvedValue(mockUser);

      const expiresAt = new Date('2026-12-31');
      const result = await repository.updateVerificationToken('u1', {
        token: 'new-token-hash',
        expiresAt,
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          email_verification_token: 'new-token-hash',
          email_verification_token_expires_at: expiresAt,
        },
        omit: {
          password: true,
          email_verification_token: true,
          email_verification_token_expires_at: true,
        },
      });
    });

    it('deve propagar erro quando prisma falha', async () => {
      prisma.user.update.mockRejectedValue(new Error('db down'));

      await expect(repository.updateVerificationToken('u1', { token: 'token', expiresAt: new Date() })).rejects.toThrow(
        'db down',
      );
    });
  });
});
