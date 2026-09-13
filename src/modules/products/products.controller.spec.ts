import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productService: jest.Mocked<ProductsService>;

  const user = { id: 'user-1', email: 'a@b.com' } as never;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            getSpecificProductById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productService = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delega getSpecificProductById ao service com o id do usuário, o shop_id e o product_id', async () => {
    productService.getSpecificProductById.mockResolvedValue({ id: 'p1' } as never);

    const result = await controller.getSpecificProductById(user, { shop_id: '1001' } as never, {
      product_id: '885178156',
    });

    expect(productService.getSpecificProductById).toHaveBeenCalledWith('user-1', '1001', '885178156');
    expect(result).toEqual({ id: 'p1' });
  });
});
