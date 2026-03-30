export const constants = {
  SALT_PASSWORD: 12,

  EMAIL_TOKEN_EXP_IN_PLAIN_TEXT: '30 minutos',

  APPLICATION_NAME: 'ShopixTurbo',

  MAIL_QUEUE: 'mail',
  SEND_VERIFICATION_EMAIL_JOB: 'send-verification-email',

  ONE_HOUR_IN_SECONDS: 3600,
};

export type Constants = typeof constants;
