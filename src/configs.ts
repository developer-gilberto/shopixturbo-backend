export const env = {
  isProduction: process.env.NODE_ENV! === 'production',
  frontendUrl: process.env.NODE_ENV! === 'production' ? process.env.FRONTEND_URL! : 'http://localhost:3000',
  serverPort: Number(process.env.PORT) || 8000,
};

export const constants = {};
