import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma.service';
import { MarketplaceType } from 'src/generated/prisma/enums';
import { GetProductFullDTO } from './products.dto';
import { ProductsRepository } from './products.repository';
import { CreateProductInput } from './products.type';

describe('ProductsRepository', () => {
  let repository: ProductsRepository;
  let prisma: {
    $queryRaw: jest.Mock;
    $transaction: jest.Mock;
    product: {
      upsert: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
      $transaction: jest.fn(),
      product: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(ProductsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertChunkProducts', () => {
    it('deve retornar array vazio quando products estiver vazio', async () => {
      const result = await repository.upsertChunkProducts('shop-1', []);
      expect(result).toEqual([]);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('deve executar upsert em chunk e retornar resultados', async () => {
      const mockResult = [{ id: 'p1', external_id: '100', wasInserted: true }];
      prisma.$queryRaw.mockResolvedValue(mockResult);

      const products: CreateProductInput[] = [
        {
          marketplace: MarketplaceType.SHOPEE,
          category_id: 10,
          name: 'Produto A',
          sku: 'SKU-1',
          image_url: 'https://img',
          stock: 5,
          sale_price_cents: 1990,
          external_id: '100',
          external_created_at: new Date(),
          external_updated_at: new Date(),
          shop_id: 'shop-1',
        },
      ];

      const result = await repository.upsertChunkProducts('shop-1', products);

      expect(result).toEqual(mockResult);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.any(Object));
    });

    it('deve processar múltiplos products no chunk', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const products: CreateProductInput[] = Array.from({ length: 3 }, (_, i) => ({
        marketplace: MarketplaceType.SHOPEE,
        category_id: 10,
        name: `Produto ${i}`,
        sku: `SKU-${i}`,
        image_url: 'https://img',
        stock: 5,
        sale_price_cents: 1990,
        external_id: String(i),
        external_created_at: new Date(),
        external_updated_at: new Date(),
        shop_id: 'shop-1',
      }));

      await repository.upsertChunkProducts('shop-1', products);

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });

  describe('upsert', () => {
    it('deve fazer upsert de um product existente', async () => {
      const mockProduct = { id: 'p1', name: 'Produto A' };
      prisma.product.upsert.mockResolvedValue(mockProduct);

      const product: CreateProductInput = {
        marketplace: MarketplaceType.SHOPEE,
        category_id: 10,
        name: 'Produto A',
        sku: 'SKU-1',
        image_url: 'https://img',
        stock: 5,
        sale_price_cents: 1990,
        cost_price_cents: 1000,
        government_taxes: 50,
        external_id: '100',
        external_created_at: new Date(),
        external_updated_at: new Date(),
        shop_id: 'shop-1',
      };

      const result = await repository.upsert('shop-1', product, new Date());

      expect(result).toEqual(mockProduct);
      expect(prisma.product.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            external_id_marketplace_shop_id: {
              external_id: '100',
              marketplace: MarketplaceType.SHOPEE,
              shop_id: 'shop-1',
            },
          },
        }),
      );
    });

    it('deve incluir cost_price_cents e government_taxes no update', async () => {
      prisma.product.upsert.mockResolvedValue({});

      const product: CreateProductInput = {
        marketplace: MarketplaceType.SHOPEE,
        category_id: 10,
        name: 'Produto A',
        stock: 5,
        sale_price_cents: 1990,
        cost_price_cents: 1000,
        government_taxes: 50,
        external_id: '100',
        external_updated_at: new Date(),
        shop_id: 'shop-1',
      };

      await repository.upsert('shop-1', product, new Date());

      expect(prisma.product.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            cost_price_cents: 1000,
            government_taxes: 50,
          }),
        }),
      );
    });
  });

  describe('getProductsFull', () => {
    it('deve retornar products com paginação', async () => {
      const mockProducts = [{ id: 'p1', name: 'Produto A' }];
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(1);

      const pagination: GetProductFullDTO = { offset: 0, page_size: 10 };

      const result = await repository.getProductsFull('shop-1', pagination);

      expect(result.products).toEqual(mockProducts);
      expect(result.pagination.total_products).toBe(1);
      expect(result.pagination.has_next_page).toBe(false);
      expect(result.pagination.next_offset).toBeNull();
    });

    it('deve calcular next_offset quando há próxima página', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(25);

      const pagination: GetProductFullDTO = { offset: 0, page_size: 10 };

      const result = await repository.getProductsFull('shop-1', pagination);

      expect(result.pagination.has_next_page).toBe(true);
      expect(result.pagination.next_offset).toBe(10);
    });

    it('deve retornar has_next_page false na última página', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(15);

      const pagination: GetProductFullDTO = { offset: 10, page_size: 10 };

      const result = await repository.getProductsFull('shop-1', pagination);

      expect(result.pagination.has_next_page).toBe(false);
      expect(result.pagination.next_offset).toBeNull();
    });

    it('deve chamar findMany com os parâmetros corretos', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const pagination: GetProductFullDTO = { offset: 5, page_size: 20 };

      await repository.getProductsFull('shop-1', pagination);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 20,
        orderBy: { updated_at: 'desc' },
        where: { shop_id: 'shop-1' },
      });
    });
  });

  describe('updateCostAndTaxes', () => {
    it('deve atualizar cost_price_cents e government_taxes', async () => {
      prisma.$transaction.mockResolvedValue([{ count: 1 }]);

      const products = [
        { id: 'p1', cost_price_cents: 2500, government_taxes: 500 },
        { id: 'p2', cost_price_cents: 3000, government_taxes: 600 },
      ];

      await repository.updateCostAndTaxes('shop-1', products);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.product.updateMany).toHaveBeenCalledTimes(2);
    });

    it('deve incluir apenas cost_price_cents quando government_taxes é undefined', async () => {
      prisma.$transaction.mockResolvedValue([{ count: 1 }]);

      const products = [{ id: 'p1', cost_price_cents: 2500, government_taxes: undefined as unknown as number }];

      await repository.updateCostAndTaxes('shop-1', products);

      expect(prisma.product.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cost_price_cents: 2500,
          }),
        }),
      );
    });

    it('deve incluir apenas government_taxes quando cost_price_cents é undefined', async () => {
      prisma.$transaction.mockResolvedValue([{ count: 1 }]);

      const products = [{ id: 'p1', cost_price_cents: undefined as unknown as number, government_taxes: 500 }];

      await repository.updateCostAndTaxes('shop-1', products);

      expect(prisma.product.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            government_taxes: 500,
          }),
        }),
      );
    });

    it('deve filtrar por external_id, shop_id e deleted_at null', async () => {
      prisma.$transaction.mockResolvedValue([{ count: 1 }]);

      const products = [{ id: 'p1', cost_price_cents: 2500, government_taxes: 500 }];

      await repository.updateCostAndTaxes('shop-1', products);

      expect(prisma.product.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            external_id: 'p1',
            shop_id: 'shop-1',
            deleted_at: null,
          },
        }),
      );
    });
  });

  describe('getEspecificProductsByIds', () => {
    it('deve buscar products por external_id', async () => {
      const mockProducts = [{ id: 'p1', external_id: '100' }];
      prisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await repository.getEspecificProductsByIds('shop-1', ['100', '200']);

      expect(result).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { shop_id: 'shop-1', external_id: { in: ['100', '200'] } },
        orderBy: { updated_at: 'desc' },
      });
    });

    it('deve retornar array vazio quando nenhum product é encontrado', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await repository.getEspecificProductsByIds('shop-1', ['999']);

      expect(result).toEqual([]);
    });
  });
});
