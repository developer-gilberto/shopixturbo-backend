import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MailProcessor } from './mail.processor';
import { MailProducer } from './mail.producer';
import { MailService } from './mail.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  providers: [MailProducer, MailProcessor, MailService],
  exports: [MailProducer],
})
export class MailModule {}
