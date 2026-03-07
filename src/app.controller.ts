import { Controller, Get, HttpCode, HttpStatus, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService } from './app.service';

@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  rootRoute() {
    return this.appService.healthCheck();
  }
}
