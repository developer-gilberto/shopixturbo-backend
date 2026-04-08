import { Logger } from '@nestjs/common';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVER_PORT: z.coerce.number().int().min(1).default(8000),
  BASE_API_URL: z.url().min(1),
  FRONTEND_URL: z.url().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+(s|m|h|d)$/)
    .default('1d'),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64),

  // Banco de dados
  DATABASE_URL: z.url().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),

  // Redis
  REDIS_URL: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1),

  // SMTP
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Shopee auth
  SHOPEE_PARTNER_ID: z.coerce.number().int().min(1),
  SHOPEE_PARTNER_KEY: z.string().min(1),
  SHOPEE_AUTH_PARTNER_HOST: z.string().min(1),
  REDIRECT_URL: z.url().min(1),

  // Shopee paths
  AUTHORIZATION_URL_PATH: z.string().min(1),
  GET_ACCESS_TOKEN_PATH: z.string().min(1),
  GET_REFRESH_TOKEN_PATH: z.string().min(1),
  GET_SHOP_INFO_PATH: z.string().min(1),
  GET_SHOP_PROFILE_PATH: z.string().min(1),
  GET_ITEM_LIST_PATH: z.string().min(1),
  GET_ITEM_BASE_INFO_PATH: z.string().min(1),
  GET_ORDER_LIST_PATH: z.string().min(1),
  GET_ORDER_DETAIL_PATH: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

const logger = new Logger('src/configs/env.schema.ts');

if (!parsed.success) {
  logger.error(`Variáveis de ambiente inválidas: "${parsed.error.name}" \n`, parsed.error.issues);
  logger.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export type Env = z.infer<typeof envSchema>;
