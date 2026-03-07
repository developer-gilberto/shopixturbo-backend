import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  healthCheck() {
    return { message: 'Documentação disponível em:  /api/v1/docs' };
  }
}
