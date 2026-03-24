import { Controller, Get, HttpCode, HttpStatus, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health Check',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
      },
      example: 'Documentação disponível em:  /api/v1/docs',
    },
  })
  @HttpCode(HttpStatus.OK)
  rootRoute() {
    return this.appService.healthCheck();
  }
}
