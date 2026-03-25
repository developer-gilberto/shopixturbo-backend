import { Injectable } from '@nestjs/common';
import { cache } from 'src/configs/cache.config';
import { PrismaService } from 'src/database/prisma.service';
import { RedisService } from 'src/database/redis.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class UsersRepository {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getByEmail(email: string) {
    return await this.prismaClient.user.findUnique({
      where: { email },
    });
  }

  async getById(userId: string) {
    return await this.prismaClient.user.findUnique({
      where: { id: userId },
      omit: {
        password: true,
        email_verification_token: true,
        email_verification_token_expires_at: true,
      },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return await this.prismaClient.user.create({
      data,
      omit: {
        password: true,
        email_verification_token: true,
        email_verification_token_expires_at: true,
      },
    });
  }

  async getByVerificationToken(tokenHash: string) {
    return this.prismaClient.user.findFirst({
      where: {
        email_verification_token: tokenHash,
      },
      omit: {
        password: true,
      },
    });
  }

  async updateEmailStatus(userId: string) {
    const user = await this.prismaClient.user.update({
      where: { id: userId },
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

    await this.redisService.delete(cache.ROUTE_ME_KEY(userId));

    return user;
  }

  async updateVerificationToken(userId: string, data: { token: string; expiresAt: Date }) {
    return this.prismaClient.user.update({
      where: { id: userId },
      data: {
        email_verification_token: data.token,
        email_verification_token_expires_at: data.expiresAt,
      },
      omit: {
        password: true,
        email_verification_token: true,
        email_verification_token_expires_at: true,
      },
    });
  }
}
