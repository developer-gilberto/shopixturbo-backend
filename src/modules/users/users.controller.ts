import { Controller, Get, HttpStatus, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserResponseDTO } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get(':user_id')
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDTO })
  async getUserById(@Param('user_id', ParseUUIDPipe) userId: string) {
    return await this.userService.getById(userId);
  }
}
