import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { constants } from 'src/configs/constants.config';
import { Env } from 'src/configs/env.schema';
import { MailProcessor } from './mail.processor';
import { MailProducer } from './mail.producer';
import { MailService } from './mail.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => ({
        connection: {
          url: configService.getOrThrow<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueueAsync({
      inject: [ConfigService],
      name: constants.MAIL_QUEUE,
    }),
  ],
  providers: [MailProducer, MailProcessor, MailService],
  exports: [MailProducer],
})
export class MailModule {}
