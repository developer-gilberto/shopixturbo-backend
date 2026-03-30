import type { StringValue } from 'ms';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.string(),

  FRONTEND_URL: z.string(),
  BASE_API_URL: z.string(),

  DATABASE_URL: z.url(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+(s|m|h|d)$/)
    .default('1d'),

  REDIS_URL: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  SHOPEE_PARTNER_ID: z.string(),
  SHOPEE_PARTNER_KEY: z.string(),
  SHOPEE_MAIN_ACCOUNT_ID: z.string(),
  SHOPEE_AUTH_PARTNER_HOST: z.string(),
  ENCRYPTION_KEY: z.string(),

  AUTHORIZATION_URL_PATH: z.string(),
  GET_ACCESS_TOKEN_PATH: z.string(),
  GET_ITEM_BASE_INFO_PATH: z.string(),
  GET_ITEM_LIST_PATH: z.string(),
  GET_ORDER_DETAIL_PATH: z.string(),
  GET_ORDER_LIST_PATH: z.string(),
  GET_REFRESH_TOKEN_PATH: z.string(),
  GET_SHOP_INFO_PATH: z.string(),
  GET_SHOP_PROFILE_PATH: z.string(),

  REDIRECT_URL: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Erro nas variáveis de ambiente: \n', z.treeifyError(parsed.error));
  console.error('❌ ERROR: \n', parsed.error);
  throw new Error('Variáveis de ambiente inválidas! ');
}

const rawEnv = parsed.data;

const IS_PRODUCTION = rawEnv.NODE_ENV === 'production';

export const env = {
  IS_PRODUCTION,

  SERVER_PORT: rawEnv.PORT ? Number(rawEnv.PORT) : 8000,

  FRONTEND_URL: IS_PRODUCTION ? rawEnv.FRONTEND_URL! : 'http://localhost:3000',

  BASE_API_URL: IS_PRODUCTION ? rawEnv.BASE_API_URL! : 'http://localhost:8000/api/v1',

  DATABASE_URL: rawEnv.DATABASE_URL,
  POSTGRES_USER: rawEnv.POSTGRES_USER,
  POSTGRES_PASSWORD: rawEnv.POSTGRES_PASSWORD,
  POSTGRES_DB: rawEnv.POSTGRES_DB,

  JWT_SECRET: rawEnv.JWT_SECRET,
  JWT_EXPIRES_IN: rawEnv.JWT_EXPIRES_IN as StringValue,

  REDIS_URL: rawEnv.REDIS_URL,
  REDIS_HOST: rawEnv.REDIS_HOST,
  REDIS_PORT: rawEnv.REDIS_PORT ? Number(rawEnv.REDIS_PORT) : undefined,

  SMTP_HOST: IS_PRODUCTION ? rawEnv.SMTP_HOST : 'localhost',
  SMTP_PORT: IS_PRODUCTION ? (rawEnv.SMTP_PORT ? Number(rawEnv.SMTP_PORT) : undefined) : 1025,
  SMTP_USER: IS_PRODUCTION ? rawEnv.SMTP_USER : '',
  SMTP_PASS: IS_PRODUCTION ? rawEnv.SMTP_PASS : '',

  SHOPEE_PARTNER_ID: rawEnv.SHOPEE_PARTNER_ID,
  SHOPEE_PARTNER_KEY: rawEnv.SHOPEE_PARTNER_KEY,
  SHOPEE_MAIN_ACCOUNT_ID: rawEnv.SHOPEE_MAIN_ACCOUNT_ID,
  SHOPEE_AUTH_PARTNER_HOST: rawEnv.SHOPEE_AUTH_PARTNER_HOST,
  ENCRYPTION_KEY: rawEnv.ENCRYPTION_KEY,

  REDIRECT_URL: rawEnv.REDIRECT_URL,

  AUTHORIZATION_URL_PATH: rawEnv.AUTHORIZATION_URL_PATH || '/api/v2/shop/auth_partner',
  GET_ACCESS_TOKEN_PATH: rawEnv.GET_ACCESS_TOKEN_PATH || '/api/v2/auth/token/get',
  GET_ITEM_BASE_INFO_PATH: rawEnv.GET_ITEM_BASE_INFO_PATH || '/api/v2/product/get_item_base_info',
  GET_ITEM_LIST_PATH: rawEnv.GET_ITEM_LIST_PATH || '/api/v2/product/get_item_list',
  GET_ORDER_DETAIL_PATH: rawEnv.GET_ORDER_DETAIL_PATH || '/api/v2/order/get_order_detail',
  GET_ORDER_LIST_PATH: rawEnv.GET_ORDER_LIST_PATH || '/api/v2/order/get_order_list',
  GET_REFRESH_TOKEN_PATH: rawEnv.GET_REFRESH_TOKEN_PATH || '/api/v2/auth/access_token/get',
  GET_SHOP_INFO_PATH: rawEnv.GET_SHOP_INFO_PATH || '/api/v2/shop/get_shop_info',
  GET_SHOP_PROFILE_PATH: rawEnv.GET_SHOP_PROFILE_PATH || '/api/v2/shop/get_profile',
};

export type Env = typeof env;

export { rawEnv };
