import { Module } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { RedisService } from 'src/database/redis.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, RedisService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
