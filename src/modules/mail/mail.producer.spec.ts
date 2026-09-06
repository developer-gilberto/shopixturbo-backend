import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import { constants } from 'src/configs/constants.config';
import { MailProducer } from './mail.producer';

describe('MailProducer', () => {
  let producer: MailProducer;
  let mailQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    mailQueue = { add: jest.fn() } as unknown as jest.Mocked<Queue>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailProducer, { provide: getQueueToken(constants.MAIL_QUEUE), useValue: mailQueue }],
    }).compile();

    producer = module.get(MailProducer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('deve adicionar job na fila com os dados corretos', async () => {
      mailQueue.add.mockResolvedValue({} as never);

      await producer.sendVerificationEmail('test@example.com', 'token-123');

      expect(mailQueue.add).toHaveBeenCalledTimes(1);
      expect(mailQueue.add).toHaveBeenCalledWith(
        constants.SEND_VERIFICATION_EMAIL_JOB,
        { to: 'test@example.com', token: 'token-123' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    });

    it('deve propagar erro quando a fila falha', async () => {
      mailQueue.add.mockRejectedValue(new Error('Queue down'));

      await expect(producer.sendVerificationEmail('test@example.com', 'token')).rejects.toThrow('Queue down');
    });
  });
});
