import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaClient: PrismaService) {}

  async getByEmail(email: string) {
    return await this.prismaClient.user.findUnique({
      where: { email },
    });
  }

  async getById(userId: string) {
    return await this.prismaClient.user.findFirst({
      where: { id: userId },
      omit: { password: true },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return await this.prismaClient.user.create({
      data,
      omit: { password: true },
    });
  }

  async getByVerificationToken(tokenHash: string) {
    return this.prismaClient.user.findFirst({
      where: {
        email_verification_token: tokenHash,
      },
      omit: { password: true },
    });
  }

  async updateEmailStatus(userId: string) {
    return this.prismaClient.user.update({
      where: { id: userId },
      data: {
        is_email_verified: true,
        email_verification_token: null,
        email_verification_token_expires_at: null,
      },
      omit: { password: true },
    });
  }

  async updateVerificationToken(userId: string, data: { token: string; expiresAt: Date }) {
    return this.prismaClient.user.update({
      where: { id: userId },
      data: {
        email_verification_token: data.token,
        email_verification_token_expires_at: data.expiresAt,
      },
      omit: { password: true },
    });
  }
}
