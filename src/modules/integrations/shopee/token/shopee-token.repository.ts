import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ShopeeTokenRepository {
  private readonly logger = new Logger(ShopeeTokenRepository.name);

  constructor(private readonly prismaClient: PrismaService) {}

  async getTokenByshopIdWithShopInclude(shopId: string) {
    try {
      return await this.prismaClient.marketplaceToken.findUnique({
        where: { shop_id: shopId },
        include: { shop: true },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao buscar access_token com shop_id "${shopId}" \n`, err);
      throw new InternalServerErrorException('Falha ao buscar o access_token.');
    }
  }

  async updateOrInsertMarketplaceToken(
    shopId: string,
    data: {
      access_token: string;
      refresh_token: string;
      external_shop_id: string;
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
          external_shop_id: data.external_shop_id,
          expires_at: data.expires_at,
        },
      });
    } catch (err) {
      this.logger.error(`Prisma: falha ao atualizar ou inserir token do marketplace com shop_id "${shopId}" \n`, err);
      throw new InternalServerErrorException('Falha ao atualizar ou inserir dados do shop.');
    }
  }
}
