import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

describe('ShopsController', () => {
  let controller: ShopsController;
  let shopService: jest.Mocked<ShopsService>;

  const user = { id: 'user-1', email: 'a@b.com' } as never;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopsController],
      providers: [
        {
          provide: ShopsService,
          useValue: {
            getShopInfo: jest.fn(),
            getShopProfile: jest.fn(),
            getShopFullByIdAndUserId: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get(ShopsController);
    shopService = module.get(ShopsService);
  });

  it('delega getShopInfoById ao service com o id do usuário e o shop_id', async () => {
    shopService.getShopInfo.mockResolvedValue({ shop_name: 'Loja' } as never);

    const result = await controller.getShopInfoById(user, { shop_id: '1001' } as never);

    expect(shopService.getShopInfo).toHaveBeenCalledWith('user-1', '1001');
    expect(result).toEqual({ shop_name: 'Loja' });
  });

  it('delega getShopProfileById ao service com o id do usuário e o shop_id', async () => {
    shopService.getShopProfile.mockResolvedValue({ shop_name: 'Loja' } as never);

    const result = await controller.getShopProfileById(user, { shop_id: '1001' } as never);

    expect(shopService.getShopProfile).toHaveBeenCalledWith('user-1', '1001');
    expect(result).toEqual({ shop_name: 'Loja' });
  });

  it('delega getShopFullById ao service', async () => {
    shopService.getShopFullByIdAndUserId.mockResolvedValue({ id: 'shop-1' } as never);

    const result = await controller.getShopFullById(user, { shop_id: '1001' } as never);

    expect(shopService.getShopFullByIdAndUserId).toHaveBeenCalledWith('user-1', '1001');
    expect(result).toEqual({ id: 'shop-1' });
  });
});
