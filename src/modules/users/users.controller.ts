import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(':user_id')
  async getUserById(@Param('user_id', ParseUUIDPipe) userId: string) {
    return await this.userService.getById(userId);
  }
}
