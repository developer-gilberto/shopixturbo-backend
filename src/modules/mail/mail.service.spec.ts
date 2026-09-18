import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  const createConfigMock = (extra: Record<string, string> = {}) => {
    const values: Record<string, string> = {
      BASE_API_URL: 'http://localhost:3000',
      SMTP_USER: 'user',
      SMTP_HOST: 'localhost',
      SMTP_PORT: '2525',
      SMTP_PASS: 'pass',
      MAIL_FROM: 'hello@demomailtrap.co',
      MAIL_FROM_NAME: 'ShopixTurbo',
      MAILTRAP_TOKEN: '',
      NODE_ENV: 'test',
      ...extra,
    };

    return {
      getOrThrow: jest.fn((key: string) => {
        if (!(key in values)) throw new Error(`ENV não configurada: ${key}`);
        return values[key];
      }),
      get: jest.fn((key: string) => values[key]),
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: createConfigMock(),
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('não valida conexão SMTP (verify) quando Mailtrap está configurado', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: createConfigMock({ MAILTRAP_TOKEN: 'token-de-teste' }),
        },
      ],
    }).compile();

    const mailService = module.get<MailService>(MailService);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await expect(mailService.onModuleInit()).resolves.toBeUndefined();
    expect(exitSpy).not.toHaveBeenCalled();

    exitSpy.mockRestore();
  });
});
