import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getByEmail(email: string) {
    return await this.usersRepository.getByEmail(email);
  }

  async getById(userId: string) {
    const user = await this.usersRepository.getById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
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
