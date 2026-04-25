import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { MarketplaceType } from 'src/generated/prisma/enums';
import { CreateProductInput } from './products.type';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prismaClient: PrismaService) {}

  async upsertChunkProducts(
    shopId: string,
    products: CreateProductInput[],
  ): Promise<{ id: string; external_id: string; wasInserted: boolean }[]> {
    if (products.length === 0) return [];

    const rows = products.map(
      (product) =>
        Prisma.sql`(
        ${crypto.randomUUID()},
        ${product.marketplace},
        ${product.category_id},
        ${product.name},
        ${product.sku},
        ${product.image_url},
        ${product.stock},
        ${product.sale_price_cents},
        ${product.external_id},
        ${product.external_created_at},
        ${product.external_updated_at},
        ${product.shop_id},
        NOW(),
        NOW()
      )`,
    );

    const sql = Prisma.sql`
      INSERT INTO products (
        id, marketplace, category_id, name, sku, image_url,
        stock, sale_price_cents, external_id, external_created_at,
        external_updated_at, shop_id, updated_at, created_at
      )
      VALUES ${Prisma.join(rows)}
      ON CONFLICT (external_id, marketplace, shop_id)
      DO UPDATE SET
        category_id         = EXCLUDED.category_id,
        name                = EXCLUDED.name,
        sku                 = EXCLUDED.sku,
        image_url           = EXCLUDED.image_url,
        stock               = EXCLUDED.stock,
        sale_price_cents    = EXCLUDED.sale_price_cents,
        external_updated_at = EXCLUDED.external_updated_at,
        updated_at          = NOW()
      WHERE
        products.shop_id             = ${shopId}
        AND products.external_updated_at < EXCLUDED.external_updated_at
      RETURNING
        id,
        external_id,
        (xmax = 0) AS "wasInserted"
    `;

    return this.prismaClient.$queryRaw<{ id: string; external_id: string; wasInserted: boolean }[]>(sql);
  }

  async upsert(shopId: string, product: CreateProductInput, updatedAt: Date) {
    return this.prismaClient.product.upsert({
      where: {
        external_id_marketplace_shop_id: {
          external_id: product.external_id!,
          marketplace: MarketplaceType.SHOPEE,
          shop_id: shopId,
        },
      },
      update: {
        name: product.name,
        sku: product.sku,
        image_url: product.image_url,
        stock: product.stock,
        sale_price_cents: product.sale_price_cents,
        cost_price_cents: product.cost_price_cents,
        government_taxes: product.government_taxes,
        external_updated_at: updatedAt,
      },
      create: {
        marketplace: MarketplaceType.SHOPEE,
        category_id: product.category_id,
        name: product.name,
        sku: product.sku,
        image_url: product.image_url,
        stock: product.stock,
        sale_price_cents: product.sale_price_cents,
        cost_price_cents: product.cost_price_cents,
        government_taxes: product.government_taxes,
        external_id: product.external_id,
        external_created_at: product.external_created_at,
        external_updated_at: updatedAt,
        shop_id: shopId,
      },
    });
  }
}
