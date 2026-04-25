import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { SyncStatus } from 'src/generated/prisma/enums';
import { CreateProductsSyncControlInput } from './products-sync.type';

@Injectable()
export class ProductsSyncControlRepository {
  constructor(private readonly prismaClient: PrismaService) {}

  async create(data: CreateProductsSyncControlInput) {
    return this.prismaClient.productsSyncControl.create({
      data,
    });
  }

  async findByShopId(shopId: string) {
    return this.prismaClient.productsSyncControl.findFirst({
      where: { shop_id: shopId },
    });
  }

  async start(id: string) {
    return this.prismaClient.productsSyncControl.update({
      where: { id },
      data: {
        status: SyncStatus.RUNNING,
        locked_at: new Date(),
      },
    });
  }

  async complete(id: string) {
    return this.prismaClient.productsSyncControl.update({
      where: { id },
      data: {
        status: SyncStatus.COMPLETED,
        locked_at: null,
        last_error: null,
      },
    });
  }

  async fail(id: string, error: string) {
    return this.prismaClient.productsSyncControl.update({
      where: { id },
      data: {
        status: SyncStatus.FAILED,
        locked_at: null,
        last_error: error,
      },
    });
  }

  async unlock(id: string) {
    return this.prismaClient.productsSyncControl.update({
      where: { id },
      data: {
        locked_at: null,
      },
    });
  }

  async updateCursor(id: string, offset: number) {
    return this.prismaClient.productsSyncControl.update({
      where: { id },
      data: {
        last_cursor: String(offset),
      },
    });
  }

  async finish(id: string, lastSyncAt: Date) {
    return this.prismaClient.productsSyncControl.update({
      where: { id },
      data: {
        last_sync_at: lastSyncAt,
        last_cursor: null,
      },
    });
  }
}
