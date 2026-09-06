import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { constants } from 'src/configs/constants.config';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';

describe('MailProcessor', () => {
  let processor: MailProcessor;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailProcessor,
        {
          provide: MailService,
          useValue: { sendVerificationEmail: jest.fn() },
        },
      ],
    }).compile();

    processor = module.get(MailProcessor);
    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('deve processar job de envio de email de verificação', async () => {
      const job = {
        name: constants.SEND_VERIFICATION_EMAIL_JOB,
        data: { to: 'test@example.com', token: 'token-123' },
        attemptsMade: 0,
      } as unknown as Job;

      await processor.process(job);

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith('test@example.com', 'token-123');
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('deve passar o número de tentativas corretamente no log', async () => {
      const job = {
        name: constants.SEND_VERIFICATION_EMAIL_JOB,
        data: { to: 'test@example.com', token: 'token-123' },
        attemptsMade: 2,
      } as unknown as Job;

      await processor.process(job);

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith('test@example.com', 'token-123');
    });

    it('deve ignorar jobs desconhecidos sem lançar erro', async () => {
      const job = {
        name: 'unknown-job',
        data: {},
        attemptsMade: 0,
      } as unknown as Job;

      await expect(processor.process(job)).resolves.toBeUndefined();
      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
