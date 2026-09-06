import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersReportController } from './orders-report.controller';
import { OrdersReportService } from './orders-report.service';

describe('OrdersReportController', () => {
  let controller: OrdersReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersReportController],
      providers: [
        {
          provide: OrdersReportService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<OrdersReportController>(OrdersReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
