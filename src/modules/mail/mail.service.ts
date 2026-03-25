import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { constants } from 'src/configs/constants.config';
import { env } from 'src/configs/env.config';
import { getVerificationEmailTemplate } from './templates/email-verification.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationUrl = `${env.API_URL}/auth/verify-email?token=${token}`;

    const htmlEmailVerification = getVerificationEmailTemplate({
      verificationUrl,
      appName: constants.APPLICATION_NAME,
      tokenExpirationInText: constants.TOKEN_EXP_IN_PLAIN_TEXT!,
    });

    await this.transporter.sendMail({
      from: `"${constants.APPLICATION_NAME}" <${env.SMTP_USER}>`,
      to,
      subject: `${constants.APPLICATION_NAME} - Confirme seu email.`,
      html: htmlEmailVerification,
      attachments: [
        {
          filename: 'logo-full-shopixturbo-1536x1024.png',
          path: join(process.cwd(), 'assets', 'logo-full-shopixturbo-1536x1024.png'),
          cid: 'logo',
        },
      ],
    });

    this.logger.log(`Email de verificação enviado para ${to}`);
  }
}
