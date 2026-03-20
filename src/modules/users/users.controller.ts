import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(':user_id')
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('user_id', ParseUUIDPipe) userId: string) {
    return await this.userService.getById(userId);
  }
}
