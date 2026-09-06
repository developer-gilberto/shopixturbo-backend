import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class PrismaPg {},
}));

jest.mock('src/generated/prisma/client', () => {
  const actual = jest.requireActual('src/generated/prisma/client');
  return {
    ...actual,
    PrismaClient: class PrismaClient {
      constructor(opts: unknown) {
        (this as unknown as { __opts: unknown }).__opts = opts;
      }
    },
  };
});

describe('PrismaService', () => {
  it('lança erro quando DATABASE_URL não está definida', () => {
    const config = { getOrThrow: jest.fn(() => '') } as unknown as ConfigService;

    expect(() => new PrismaService(config)).toThrow('DATABASE_URL não está definida');
  });

  it('instancia com adapter quando DATABASE_URL é fornecida', () => {
    const config = { getOrThrow: jest.fn(() => 'postgresql://localhost:5432/db') } as unknown as ConfigService;

    const prisma = new PrismaService(config);

    expect(prisma).toBeDefined();
  });
});
