import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { constants } from 'src/configs/constants.config';
import { MailService } from './mail.service';

@Processor(constants.MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case constants.SEND_VERIFICATION_EMAIL_JOB:
        await this.handleSendVerificationEmail(job);
        break;
      default:
        this.logger.warn(`Job desconhecido recebido: ${job.name}`);
    }
  }

  private async handleSendVerificationEmail(job: Job): Promise<void> {
    const { to, token } = job.data;
    this.logger.log(`Processando envio de email para ${to} (tentativa ${job.attemptsMade + 1})`);
    await this.mailService.sendVerificationEmail(to, token);
  }
}
