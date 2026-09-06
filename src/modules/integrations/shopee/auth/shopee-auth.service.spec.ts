import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ShopeeAuthService } from './shopee-auth.service';

describe('ShopeeAuthService', () => {
  let service: ShopeeAuthService;

  const configFake = (overrides: Record<string, string> = {}) => {
    const values: Record<string, string> = {
      SHOPEE_PARTNER_ID: '1001',
      SHOPEE_PARTNER_KEY: 'a'.repeat(32),
      SHOPEE_AUTH_PARTNER_HOST: 'https://partner.shopeemobile.com',
      AUTHORIZATION_URL_PATH: '/api/v2/shop/auth_partner',
      REDIRECT_URL: 'https://app.example.com/callback',
      GET_ACCESS_TOKEN_PATH: '/api/v2/auth/token/get',
      GET_REFRESH_TOKEN_PATH: '/api/v2/auth/access_token/get',
      ...overrides,
    };
    return { getOrThrow: jest.fn((key: string) => values[key]) };
  };

  const mockFetchOk = (payload: unknown) =>
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => payload } as Response);

  const mockFetchFail = (status: number, statusText: string) =>
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status, statusText } as Response);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopeeAuthService, { provide: ConfigService, useValue: configFake() }],
    }).compile();

    service = module.get(ShopeeAuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateSignedUrl', () => {
    it('inclui access_token e shop_id quando ambos são fornecidos', () => {
      const url = service.generateSignedUrl({ path: '/api/v2/path', accessToken: 'tok', shopId: 55 });

      expect(url).toContain('https://partner.shopeemobile.com/api/v2/path');
      expect(url).toContain('access_token=tok');
      expect(url).toContain('partner_id=1001');
      expect(url).toContain('shop_id=55');
      expect(url).toContain('timestamp=');
      expect(url).toContain('sign=');
    });

    it('omite access_token e shop_id quando não são fornecidos', () => {
      const url = service.generateSignedUrl({ path: '/api/v2/path' });

      expect(url).not.toContain('access_token=');
      expect(url).not.toContain('shop_id=');
      expect(url).toContain('partner_id=1001');
      expect(url).toContain('timestamp=');
      expect(url).toContain('sign=');
    });

    it('gera uma assinatura em sha256 hex com 64 caracteres', () => {
      const url = service.generateSignedUrl({ path: '/api/v2/path', accessToken: 'tok', shopId: 55 });
      const sign = new URL(url).searchParams.get('sign');

      expect(sign).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('generateAuthorizationUrl', () => {
    it('retorna url de autorização com redirect', () => {
      const url = service.generateAuthorizationUrl();

      expect(url).toContain('/api/v2/shop/auth_partner');
      expect(url).toContain('redirect=https://app.example.com/callback');
    });
  });

  describe('exchangeCodeForAccessToken', () => {
    it('troca o código por tokens via POST', async () => {
      const payload = { access_token: 'a', refresh_token: 'r', expire_in: 14400 };
      const fetchSpy = mockFetchOk(payload);

      const result = await service.exchangeCodeForAccessToken('code-1', '55');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/auth/token/get'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual(payload);
    });

    it('lança HttpException quando a API retorna erro', async () => {
      mockFetchFail(401, 'Unauthorized');

      await expect(service.exchangeCodeForAccessToken('code-1', '55')).rejects.toThrow(
        expect.objectContaining({ status: 401 }),
      );
    });
  });

  describe('getAccessToken', () => {
    it('obtém access token via refresh token', async () => {
      const payload = { access_token: 'a', refresh_token: 'r', expire_in: 14400 };
      const fetchSpy = mockFetchOk(payload);

      const result = await service.getAccessToken('55', 'refresh-1');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/auth/access_token/get'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual(payload);
    });

    it('lança HttpException quando a API retorna erro', async () => {
      mockFetchFail(403, 'Forbidden');

      await expect(service.getAccessToken('55', 'refresh-1')).rejects.toThrow(expect.objectContaining({ status: 403 }));
    });
  });
});
