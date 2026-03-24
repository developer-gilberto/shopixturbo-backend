import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.DATABASE_URL as string;

    if (!connectionString) {
      throw new Error('DATABASE_URL não está definida');
    }

    const adapter = new PrismaPg({
      connectionString,
    });

    super({ adapter });
  }
}
