import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

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
