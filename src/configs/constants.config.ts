import { rawEnv } from './env.config';

export const constants = {
  SALT_PASSWORD: 12,

  TOKEN_EXP_IN_PLAIN_TEXT: rawEnv.EMAIL_TOKEN_EXP_IN_PLAIN_TEXT,

  APPLICATION_NAME: 'ShopixTurbo',

  MAIL_QUEUE: 'mail',
  SEND_VERIFICATION_EMAIL_JOB: 'send-verification-email',
};

export type Constants = typeof constants;
