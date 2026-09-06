import { Test, TestingModule } from '@nestjs/testing';
import { OrdersRepository } from './orders.repository';

describe('OrdersRepository', () => {
  let repository: OrdersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersRepository],
    }).compile();

    repository = module.get(OrdersRepository);
  });

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });
});
