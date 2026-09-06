import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsSyncController } from './products-sync.controller';
import { ProductsSyncService } from './products-sync.service';

describe('ProductsSyncController', () => {
  let controller: ProductsSyncController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsSyncController],
      providers: [
        {
          provide: ProductsSyncService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ProductsSyncController>(ProductsSyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
