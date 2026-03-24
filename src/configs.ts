export const env = {
  IS_PRODUCTION: process.env.NODE_ENV! === 'production',
  FRONTEND_URL: process.env.NODE_ENV! === 'production' ? (process.env.FRONTEND_URL as string) : 'http://localhost:3000',
  SERVER_PORT: Number(process.env.PORT) || 8000,
  API_URL: process.env.NODE_ENV! === 'production' ? (process.env.API_URL as string) : 'http://localhost:8000/api/v1',
  SMTP_HOST: process.env.NODE_ENV! === 'production' ? (process.env.SMTP_HOST as string) : 'localhost',
  SMTP_PORT: process.env.NODE_ENV! === 'production' ? Number(process.env.SMTP_PORT) : 1025,
  SMTP_USER: process.env.NODE_ENV! === 'production' ? (process.env.SMTP_USER as string) : '',
  SMTP_PASS: process.env.NODE_ENV! === 'production' ? (process.env.SMTP_PASS as string) : '',
};

export const constants = {
  SALT_PASSWORD: 12,
  JWT_SECRET: process.env.JWT_SECRET as string,
  EMAIL_VERIFICATION_TOKEN_EXPIRATION_IN_TEXT: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRATION_IN_TEXT,
  APPLICATION_NAME: 'ShopixTurbo',
  MAIL_QUEUE: 'mail',
  SEND_VERIFICATION_EMAIL_JOB: 'send-verification-email',
};

export const cache = {
  ROUTE_ME_TTL: 60 * 5, // 5 minutos
  ROUTE_ME_KEY: (userId: string) => `user:me:${userId}`,
};
