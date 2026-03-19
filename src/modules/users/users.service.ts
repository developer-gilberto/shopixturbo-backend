import { Injectable, NotFoundException } from '@nestjs/common';
import { SignUpDTO } from '../auth/auth.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getByEmail(email: string) {
    const user = await this.usersRepository.getByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getById(userId: string) {
    const user = await this.usersRepository.getById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async checkEmailAvailability(email: string) {
    const storedEmail = await this.getByEmail(email);
    if (!storedEmail) return true;
    return false;
  }

  async create(data: SignUpDTO) {
    return await this.usersRepository.create(data);
  }
}
