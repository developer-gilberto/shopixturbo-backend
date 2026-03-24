import { Injectable, NotFoundException } from '@nestjs/common';
import { cache } from 'src/configs';
import { RedisService } from 'src/database/redis.service';
import { Prisma } from 'src/generated/prisma/client';
import { UserResponseDTO } from './users.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
  ) {}

  async getByEmail(email: string) {
    return await this.usersRepository.getByEmail(email);
  }

  async getById(userId: string) {
    const cacheKey = cache.ROUTE_ME_KEY(userId);

    const cached = await this.redisService.get<UserResponseDTO>(cacheKey);
    if (cached) return cached;

    const user = await this.usersRepository.getById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    await this.redisService.set(cacheKey, user, cache.ROUTE_ME_TTL);

    return user;
  }

  async checkEmailAvailability(email: string) {
    const storedEmail = await this.getByEmail(email);
    if (!storedEmail) return true;
    return false;
  }

  async create(data: Prisma.UserCreateInput) {
    return await this.usersRepository.create(data);
  }

  async getByVerificationToken(token: string) {
    return await this.usersRepository.getByVerificationToken(token);
  }

  async activateAccount(userId: string) {
    return await this.usersRepository.updateEmailStatus(userId);
  }

  async updateEmailVerificationToken(userId: string, data: { token: string; expiresAt: Date }) {
    return await this.usersRepository.updateVerificationToken(userId, data);
  }
}
