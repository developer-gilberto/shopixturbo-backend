import { join } from 'node:path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailtrapTransport } from 'mailtrap';
import * as nodemailer from 'nodemailer';
import { constants } from 'src/configs/constants.config';
import { Env } from 'src/configs/env.schema';
import { getVerificationEmailTemplate } from './templates/email-verification.template';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  private readonly transporter: nodemailer.Transporter;
  private readonly baseApiUrl: string;
  private readonly smtpUser: string;
  private readonly smtpHost: string;
  private readonly smtpPort: number;
  private readonly smtpPass: string;
  private readonly mailFrom: string;
  private readonly mailFromName: string;
  private readonly mailtrapToken: string;
  private readonly isMailtrap: boolean;
  private readonly isProd: boolean;

  constructor(private readonly configService: ConfigService<Env>) {
    this.baseApiUrl = this.configService.getOrThrow<string>('BASE_API_URL');
    this.mailFrom = this.configService.getOrThrow<string>('MAIL_FROM');
    this.mailFromName = this.configService.get<string>('MAIL_FROM_NAME') ?? constants.APPLICATION_NAME;
    this.mailtrapToken = this.configService.get<string>('MAILTRAP_TOKEN') ?? '';
    this.isMailtrap = this.mailtrapToken.length > 0;
    this.isProd = this.configService.getOrThrow<string>('NODE_ENV') === 'production';

    this.smtpUser = this.configService.getOrThrow<string>('SMTP_USER');
    this.smtpHost = this.configService.getOrThrow<string>('SMTP_HOST');
    this.smtpPort = this.configService.getOrThrow<number>('SMTP_PORT');
    this.smtpPass = this.configService.getOrThrow<string>('SMTP_PASS');

    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    if (this.isMailtrap) {
      return nodemailer.createTransport(MailtrapTransport({ token: this.mailtrapToken }));
    }

    return nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpPort === 465,
      auth: {
        user: this.smtpUser,
        pass: this.smtpPass,
      },
    });
  }

  async onModuleInit() {
    if (this.isMailtrap) {
      this.logger.log('Serviço de email configurado com Mailtrap (API)');
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log(
        this.isProd ? 'Servidor SMTP conectado!' : `Servidor SMTP conectado em ${this.smtpHost}:${this.smtpPort}`,
      );
    } catch (err) {
      this.logger.error('Falha ao conectar no servidor SMTP ', err);
      process.exit(1);
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationUrl = `${this.baseApiUrl}/api/v1/auth/verify-email?token=${token}`;

    const htmlEmailVerification = getVerificationEmailTemplate({
      verificationUrl,
      appName: constants.APPLICATION_NAME,
      tokenExpirationInText: constants.EMAIL_TOKEN_EXP_IN_PLAIN_TEXT,
    });

    await this.transporter.sendMail({
      from: `${this.mailFromName} <${this.mailFrom}>`,
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

    this.logger.log(`Email de verificação enviado para "${to}"`);
  }
}
