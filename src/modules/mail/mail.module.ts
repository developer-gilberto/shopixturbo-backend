import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { constants } from 'src/configs/constants.config';
import { MailProcessor } from './mail.processor';
import { MailProducer } from './mail.producer';
import { MailService } from './mail.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: constants.MAIL_QUEUE,
    }),
  ],
  providers: [MailProducer, MailProcessor, MailService],
  exports: [MailProducer],
})
export class MailModule {}
