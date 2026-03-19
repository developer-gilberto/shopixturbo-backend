export const env = {
  IS_PRODUCTION: process.env.NODE_ENV! === 'production',
  FRONTEND_URL: process.env.NODE_ENV! === 'production' ? (process.env.FRONTEND_URL as string) : 'http://localhost:3000',
  SERVER_PORT: Number(process.env.PORT) || 8000,
};

export const constants = {
  SALT_PASSWORD: 12,
};
