import type { StringValue } from 'ms';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.string().optional(),

  FRONTEND_URL: z.string().optional(),
  API_URL: z.string().optional(),

  DATABASE_URL: z.url(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+(s|m|h|d)$/)
    .default('1d'),

  EMAIL_TOKEN_EXP_IN_PLAIN_TEXT: z.string(),

  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Erro nas variáveis de ambiente: \n', z.treeifyError(parsed.error));
  throw new Error('Variáveis de ambiente inválidas! ');
}

const rawEnv = parsed.data;

const IS_PRODUCTION = rawEnv.NODE_ENV === 'production';

export const env = {
  IS_PRODUCTION,

  SERVER_PORT: rawEnv.PORT ? Number(rawEnv.PORT) : 8000,

  FRONTEND_URL: IS_PRODUCTION ? rawEnv.FRONTEND_URL! : 'http://localhost:3000',

  API_URL: IS_PRODUCTION ? rawEnv.API_URL! : 'http://localhost:8000/api/v1',

  DATABASE_URL: rawEnv.DATABASE_URL,
  POSTGRES_USER: rawEnv.POSTGRES_USER,
  POSTGRES_PASSWORD: rawEnv.POSTGRES_PASSWORD,
  POSTGRES_DB: rawEnv.POSTGRES_DB,

  JWT_SECRET: rawEnv.JWT_SECRET,
  JWT_EXPIRES_IN: rawEnv.JWT_EXPIRES_IN as StringValue,

  EMAIL_TOKEN_EXP_IN_PLAIN_TEXT: rawEnv.EMAIL_TOKEN_EXP_IN_PLAIN_TEXT,

  REDIS_URL: rawEnv.REDIS_URL,
  REDIS_HOST: rawEnv.REDIS_HOST,
  REDIS_PORT: rawEnv.REDIS_PORT ? Number(rawEnv.REDIS_PORT) : undefined,

  SMTP_HOST: IS_PRODUCTION ? rawEnv.SMTP_HOST : 'localhost',
  SMTP_PORT: IS_PRODUCTION ? (rawEnv.SMTP_PORT ? Number(rawEnv.SMTP_PORT) : undefined) : 1025,
  SMTP_USER: IS_PRODUCTION ? rawEnv.SMTP_USER : '',
  SMTP_PASS: IS_PRODUCTION ? rawEnv.SMTP_PASS : '',
};

export type Env = typeof env;

export { rawEnv };
