import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { constants } from 'src/configs/constants.config';

@Injectable()
export class MailProducer {
  constructor(@InjectQueue(constants.MAIL_QUEUE) private readonly mailQueue: Queue) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    await this.mailQueue.add(
      constants.SEND_VERIFICATION_EMAIL_JOB,
      { to, token },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
