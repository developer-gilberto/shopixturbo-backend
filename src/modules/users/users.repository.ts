import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { cache } from 'src/configs/cache.config';
import { PrismaService } from 'src/database/prisma.service';
import { RedisService } from 'src/database/redis.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(
    private readonly prismaClient: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getByEmail(email: string) {
    try {
      return await this.prismaClient.user.findUnique({
        where: { email },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao buscar usuário com email "${email}" \n`, err);
      throw new InternalServerErrorException('Falha ao buscar o usuário.');
    }
  }

  async getById(userId: string) {
    try {
      return await this.prismaClient.user.findUnique({
        where: { id: userId },
        omit: {
          password: true,
          email_verification_token: true,
          email_verification_token_expires_at: true,
        },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao buscar usuário com userId "${userId}" \n`, err);
      throw new InternalServerErrorException('Falha ao buscar o usuário.');
    }
  }

  async create(data: Prisma.UserCreateInput) {
    try {
      return await this.prismaClient.user.create({
        data,
        omit: {
          password: true,
          email_verification_token: true,
          email_verification_token_expires_at: true,
        },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao registrar usuário com email "${data.email}" \n`, err);
      throw new InternalServerErrorException('Falha ao registrar o usuário.');
    }
  }

  async getByVerificationToken(tokenHash: string) {
    try {
      return this.prismaClient.user.findFirst({
        where: {
          email_verification_token: tokenHash,
        },
        omit: {
          password: true,
        },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao buscar usuário com tokenHash "${tokenHash}" \n`, err);
      throw new InternalServerErrorException('Falha ao buscar o usuário.');
    }
  }

  async updateEmailStatus(userId: string) {
    try {
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

      await this.redisService.delete(cache.userMeKey(userId));

      return user;
    } catch (err) {
      this.logger.error(
        `Prisma: falha ao atualizar o status de is_email_verified do usuário com userId "${userId}" \n`,
        err,
      );
      throw new InternalServerErrorException('Falha ao atualizar status de email do usuário.');
    }
  }

  async updateVerificationToken(userId: string, data: { token: string; expiresAt: Date }) {
    try {
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
    } catch (err) {
      this.logger.error(`Prisma: falha ao atualizar o token de verificação do usuário com userId "${userId}" \n`, err);
      throw new InternalServerErrorException('Falha ao atualizar o token de verificação do usuário.');
    }
  }
}
