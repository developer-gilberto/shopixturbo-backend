import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from 'src/database/redis.service';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let redisService: jest.Mocked<RedisService>;

  const user = {
    id: 'user-1',
    name: 'Ana',
    email: 'ana@example.com',
    role: 'USER',
    is_email_verified: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            getByEmail: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            getByVerificationToken: jest.fn(),
            updateEmailStatus: jest.fn(),
            updateVerificationToken: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
    redisService = module.get(RedisService);
  });

  describe('getById', () => {
    it('retorna o usuário em cache quando existe', async () => {
      redisService.get.mockResolvedValue(user as never);

      const result = await service.getById('user-1');

      expect(result).toEqual(user);
      expect(repository.getById).not.toHaveBeenCalled();
    });

    it('busca do repositório e popula o cache quando não há dados em cache', async () => {
      redisService.get.mockResolvedValue(null);
      repository.getById.mockResolvedValue(user as never);

      const result = await service.getById('user-1');

      expect(repository.getById).toHaveBeenCalledWith('user-1');
      expect(redisService.set).toHaveBeenCalledWith('user:me:user-1', user, expect.any(Number));
      expect(result).toEqual(user);
    });

    it('lança NotFoundException quando o usuário não existe', async () => {
      redisService.get.mockResolvedValue(null);
      repository.getById.mockResolvedValue(null);

      await expect(service.getById('user-999')).rejects.toThrow(new NotFoundException('Usuário não encontrado.'));
    });
  });

  describe('checkEmailAvailability', () => {
    it('retorna true quando o email não está cadastrado', async () => {
      repository.getByEmail.mockResolvedValue(null);

      await expect(service.checkEmailAvailability('nova@example.com')).resolves.toBe(true);
    });

    it('retorna false quando o email já está cadastrado', async () => {
      repository.getByEmail.mockResolvedValue(user as never);

      await expect(service.checkEmailAvailability('ana@example.com')).resolves.toBe(false);
    });
  });

  describe('delegação para o repositório', () => {
    it('getByEmail delega ao repositório', async () => {
      repository.getByEmail.mockResolvedValue(user as never);

      await expect(service.getByEmail('ana@example.com')).resolves.toEqual(user);
      expect(repository.getByEmail).toHaveBeenCalledWith('ana@example.com');
    });

    it('create delega ao repositório', async () => {
      const data = { email: 'a@b.com' } as never;
      repository.create.mockResolvedValue(user as never);

      await expect(service.create(data)).resolves.toEqual(user);
      expect(repository.create).toHaveBeenCalledWith(data);
    });

    it('getByVerificationToken delega ao repositório', async () => {
      repository.getByVerificationToken.mockResolvedValue(user as never);

      await expect(service.getByVerificationToken('hash')).resolves.toEqual(user);
      expect(repository.getByVerificationToken).toHaveBeenCalledWith('hash');
    });

    it('activateAccount delega ao repositório', async () => {
      repository.updateEmailStatus.mockResolvedValue(user as never);

      await expect(service.activateAccount('user-1')).resolves.toEqual(user);
      expect(repository.updateEmailStatus).toHaveBeenCalledWith('user-1');
    });

    it('updateEmailVerificationToken delega ao repositório', async () => {
      const data = { token: 't', expiresAt: new Date() };
      repository.updateVerificationToken.mockResolvedValue(user as never);

      await expect(service.updateEmailVerificationToken('user-1', data)).resolves.toEqual(user);
      expect(repository.updateVerificationToken).toHaveBeenCalledWith('user-1', data);
    });
  });
});
