import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ShopeeController } from './shopee.controller';
import { ShopeeService } from './shopee.service';

describe('ShopeeController', () => {
  let controller: ShopeeController;
  let shopeeService: jest.Mocked<ShopeeService>;

  const user = { id: 'user-1', email: 'a@b.com' } as never;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopeeController],
      providers: [
        {
          provide: ShopeeService,
          useValue: {
            getAuthUrl: jest.fn(),
            handleCallback: jest.fn(),
          },
        },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get(ShopeeController);
    shopeeService = module.get(ShopeeService);
  });

  it('getAuthUrl retorna a url de autorização', async () => {
    shopeeService.getAuthUrl.mockReturnValue('https://auth.example.com');

    const result = await controller.getAuthUrl();

    expect(result).toEqual({ auth_url: 'https://auth.example.com' });
  });

  it('handleCallbackGetToken delega ao service com o id do usuário e os dados do callback', async () => {
    const callback = { code: 'code-1', shop_id: '55' } as never;
    shopeeService.handleCallback.mockResolvedValue({ message: 'ok' } as never);

    const result = await controller.handleCallbackGetToken(user, callback);

    expect(shopeeService.handleCallback).toHaveBeenCalledWith('user-1', callback);
    expect(result).toEqual({ message: 'ok' });
  });
});
