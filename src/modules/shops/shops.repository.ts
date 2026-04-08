import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ShopCreate } from './shops.type';

@Injectable()
export class ShopsRepository {
  private readonly logger = new Logger(ShopsRepository.name);

  constructor(private readonly prismaClient: PrismaService) {}

  async createShop(data: ShopCreate) {
    try {
      return await this.prismaClient.shop.create({ data });
    } catch (err) {
      this.logger.error(`Prisma: falha ao registrar shop com external_id "${data.external_id}" \n`, err);
      throw new InternalServerErrorException('Falha ao registrar o shop.');
    }
  }

  async getShopByExternalIdAndUserId(externalId: string, userId: string) {
    try {
      return await this.prismaClient.shop.findFirst({
        where: { external_id: externalId, user_id: userId },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao buscar shop com external_id "${externalId}" e user_id "${userId}" \n`, err);
      throw new InternalServerErrorException('Falha ao buscar o shop.');
    }
  }

  async getShopByIdWithTokenInclude(shopId: string) {
    try {
      return await this.prismaClient.shop.findUnique({
        where: { id: shopId },
        include: { marketplace_token: true },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao buscar shop com id "${shopId}" \n`, err);
      throw new InternalServerErrorException('Falha ao buscar o shop.');
    }
  }

  async updateOrInsertMarketplaceToken(
    shopId: string,
    data: {
      access_token: string;
      refresh_token: string;
      expires_at: Date;
    },
  ) {
    try {
      return await this.prismaClient.marketplaceToken.upsert({
        where: { shop_id: shopId },
        update: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
        },
        create: {
          shop_id: shopId,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
        },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao atualizar ou inserir token do marketplace com shop_id "${shopId}" \n`, err);
      throw new InternalServerErrorException('Falha ao atualizar ou inserir dados do shop.');
    }
  }

  async updateShop(
    shopId: string,
    data: {
      name: string;
      shop_logo: string;
      description: string;
      authorization_expiration: Date;
    },
  ) {
    try {
      return await this.prismaClient.shop.update({
        where: { id: shopId },
        data,
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao atualizar shop com shop_id "${shopId}" \n`, err);
      throw new InternalServerErrorException('Falha ao atualizar dados do shop.');
    }
  }

  async getShopByUserId(userId: string) {
    try {
      return await this.prismaClient.shop.findMany({
        where: { user_id: userId, deleted_at: null },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao buscar shop com user_id "${userId}" \n`, err);
      throw new InternalServerErrorException('Falha ao buscar dados do shop.');
    }
  }
}
