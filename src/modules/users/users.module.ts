import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [JwtService, UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
