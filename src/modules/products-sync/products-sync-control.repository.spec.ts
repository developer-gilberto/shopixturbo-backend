import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma.service';
import { MarketplaceType, SyncStatus } from 'src/generated/prisma/enums';
import { ProductsSyncControlRepository } from './products-sync-control.repository';

describe('ProductsSyncControlRepository', () => {
  let repository: ProductsSyncControlRepository;
  let prisma: {
    productsSyncControl: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      productsSyncControl: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsSyncControlRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(ProductsSyncControlRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um registro de controle de sincronização', async () => {
      const mockRecord = { id: 'sync-1', shop_id: 'shop-1', status: SyncStatus.PENDING };
      prisma.productsSyncControl.create.mockResolvedValue(mockRecord);

      const data = { shop_id: 'shop-1', marketplace: MarketplaceType.SHOPEE };

      const result = await repository.create(data);

      expect(result).toEqual(mockRecord);
      expect(prisma.productsSyncControl.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('findByShopId', () => {
    it('deve retornar o primeiro registro encontrado para o shop', async () => {
      const mockRecord = { id: 'sync-1', shop_id: 'shop-1' };
      prisma.productsSyncControl.findFirst.mockResolvedValue(mockRecord);

      const result = await repository.findByShopId('shop-1');

      expect(result).toEqual(mockRecord);
      expect(prisma.productsSyncControl.findFirst).toHaveBeenCalledWith({ where: { shop_id: 'shop-1' } });
    });

    it('deve retornar null quando não existe registro', async () => {
      prisma.productsSyncControl.findFirst.mockResolvedValue(null);

      const result = await repository.findByShopId('shop-notfound');

      expect(result).toBeNull();
    });
  });

  describe('start', () => {
    it('deve atualizar status para RUNNING e definir locked_at', async () => {
      const mockRecord = { id: 'sync-1', status: SyncStatus.RUNNING };
      prisma.productsSyncControl.update.mockResolvedValue(mockRecord);

      const result = await repository.start('sync-1');

      expect(result).toEqual(mockRecord);
      expect(prisma.productsSyncControl.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: {
          status: SyncStatus.RUNNING,
          locked_at: expect.any(Date),
        },
      });
    });
  });

  describe('complete', () => {
    it('deve atualizar status para COMPLETED e limpar locked_at e last_error', async () => {
      const mockRecord = { id: 'sync-1', status: SyncStatus.COMPLETED };
      prisma.productsSyncControl.update.mockResolvedValue(mockRecord);

      const result = await repository.complete('sync-1');

      expect(result).toEqual(mockRecord);
      expect(prisma.productsSyncControl.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: {
          status: SyncStatus.COMPLETED,
          locked_at: null,
          last_error: null,
        },
      });
    });
  });

  describe('fail', () => {
    it('deve atualizar status para FAILED e registrar o erro', async () => {
      const mockRecord = { id: 'sync-1', status: SyncStatus.FAILED, last_error: 'Shopee indisponível' };
      prisma.productsSyncControl.update.mockResolvedValue(mockRecord);

      const result = await repository.fail('sync-1', 'Shopee indisponível');

      expect(result).toEqual(mockRecord);
      expect(prisma.productsSyncControl.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: {
          status: SyncStatus.FAILED,
          locked_at: null,
          last_error: 'Shopee indisponível',
        },
      });
    });
  });

  describe('unlock', () => {
    it('deve limpar locked_at', async () => {
      const mockRecord = { id: 'sync-1', locked_at: null };
      prisma.productsSyncControl.update.mockResolvedValue(mockRecord);

      const result = await repository.unlock('sync-1');

      expect(result).toEqual(mockRecord);
      expect(prisma.productsSyncControl.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: { locked_at: null },
      });
    });
  });

  describe('updateCursor', () => {
    it('deve atualizar last_cursor com o offset convertido para string', async () => {
      const mockRecord = { id: 'sync-1', last_cursor: '50' };
      prisma.productsSyncControl.update.mockResolvedValue(mockRecord);

      const result = await repository.updateCursor('sync-1', 50);

      expect(result).toEqual(mockRecord);
      expect(prisma.productsSyncControl.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: { last_cursor: '50' },
      });
    });

    it('deve converter offset 0 para string "0"', async () => {
      prisma.productsSyncControl.update.mockResolvedValue({});

      await repository.updateCursor('sync-1', 0);

      expect(prisma.productsSyncControl.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: { last_cursor: '0' },
      });
    });
  });

  describe('finish', () => {
    it('deve atualizar last_sync_at e limpar last_cursor', async () => {
      const lastSyncAt = new Date('2026-09-06');
      const mockRecord = { id: 'sync-1', last_sync_at: lastSyncAt, last_cursor: null };
      prisma.productsSyncControl.update.mockResolvedValue(mockRecord);

      const result = await repository.finish('sync-1', lastSyncAt);

      expect(result).toEqual(mockRecord);
      expect(prisma.productsSyncControl.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: {
          last_sync_at: lastSyncAt,
          last_cursor: null,
        },
      });
    });
  });
});
