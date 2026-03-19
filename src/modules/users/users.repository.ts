import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SignUpDTO } from '../auth/auth.dto';

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

  async create(data: SignUpDTO) {
    return await this.prismaClient.user.create({
      data,
      omit: { password: true },
    });
  }
}
