import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Env } from 'src/configs/env.schema';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService<Env>) {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL não está definida');
    }

    const adapter = new PrismaPg({
      connectionString,
    });

    super({ adapter });
  }
}
