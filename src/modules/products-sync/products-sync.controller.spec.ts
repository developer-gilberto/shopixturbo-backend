import { Test, TestingModule } from '@nestjs/testing';
import { ProductsSyncController } from './products-sync.controller';

describe('ProductsSyncController', () => {
  let controller: ProductsSyncController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsSyncController],
    }).compile();

    controller = module.get<ProductsSyncController>(ProductsSyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
