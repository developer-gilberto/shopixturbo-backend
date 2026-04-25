import { Test, TestingModule } from '@nestjs/testing';
import { ProductsSyncService } from './products-sync.service';

describe('ProductsSyncService', () => {
  let service: ProductsSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsSyncService],
    }).compile();

    service = module.get<ProductsSyncService>(ProductsSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
