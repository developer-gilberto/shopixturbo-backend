# SKILLS.md - ShopixTurbo Backend

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Configuração do Ambiente](#4-configuração-do-ambiente)
5. [Módulos e Funcionalidades](#5-módulos-e-funcionalidades)
6. [API Endpoints](#6-api-endpoints)
7. [Banco de Dados](#7-banco-de-dados)
8. [Autenticação e Segurança](#8-autenticação-e-segurança)
9. [Filas e Cache](#9-filas-e-cache)
10. [Email](#10-email)
11. [Testes](#11-testes)
12. [Linting e Formatação](#12-linting-e-formatação)
13. [Scripts Disponíveis](#13-scripts-disponíveis)
14. [Padrões e Convenções](#14-padrões-e-convenções)
15. [Docker Services](#15-docker-services)

---

## 1. Visão Geral do Projeto

**Nome:** ShopixTurbo Backend  
**Versão:** 1.0.0  
**Descrição:** API RESTful para integração e consumo da API oficial da Shopee e futuras integrações com outros marketplaces.  
**Autor:** Gilberto Lopes

### Propósito

Backend robusto construído com NestJS para gerenciar autenticação de usuários, integrações com marketplaces, envio de emails assíncronos e cache.

---

## 2. Stack Tecnológico

| Categoria        | Tecnologia           | Versão                  |
| ---------------- | -------------------- | ----------------------- |
| Framework        | NestJS               | ^11.0.1                 |
| Linguagem        | TypeScript           | ^5.7.3                  |
| Banco de Dados   | PostgreSQL           | 18                      |
| ORM              | Prisma               | ^7.5.0                  |
| Fila/Cache       | Redis + BullMQ       | 7                       |
| Documentação API | Swagger/OpenAPI      | @nestjs/swagger ^11.2.6 |
| Email            | Nodemailer           | ^8.0.3                  |
| Autenticação     | JWT                  | @nestjs/jwt ^11.0.2     |
| Validação        | class-validator, Zod | Latest                  |
| Segurança        | Helmet               | ^8.1.0                  |
| Linting          | Biome                | 2.4.5                   |
| Testes           | Jest                 | ^30.0.0                 |
| Package Manager  | pnpm                 | 10.30.3                 |

---

## 3. Estrutura do Projeto

```
shopixturbo-backend/
├── assets/                          # Arquivos estáticos (logos, imagens)
├── data/                           # Volume Docker do PostgreSQL
├── prisma/                         # Schema e migrations do banco
│   ├── migrations/                 # Arquivos de migração
│   │   ├── 20260319140048_init/
│   │   └── 20260321224126_add_email_verification/
│   └── schema.prisma               # Definição do schema Prisma
├── src/                            # Código fonte
│   ├── main.ts                     # Ponto de entrada da aplicação
│   ├── app.module.ts               # Módulo raiz
│   ├── app.controller.ts           # Controller raiz
│   ├── app.service.ts              # Service raiz
│   ├── app.controller.spec.ts      # Testes do controller raiz
│   ├── configs/                    # Arquivos de configuração
│   │   ├── env.config.ts          # Validação de env vars (Zod)
│   │   ├── constants.config.ts    # Constantes da aplicação
│   │   └── cache.config.ts        # Configuração de cache Redis
│   ├── database/                   # Serviços de banco
│   │   ├── prisma.service.ts      # Service Prisma ORM
│   │   └── redis.service.ts        # Service Redis para cache
│   ├── generated/                  # Cliente Prisma gerado
│   │   └── prisma/                # Arquivos gerados do Prisma
│   ├── common/                    # Utilitários compartilhados
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── types/
│   │       └── token-payload.type.ts
│   └── modules/                    # Módulos de funcionalidades
│       ├── auth/                  # Módulo de autenticação
│       ├── users/                 # Módulo de gerenciamento de usuários
│       ├── mail/                  # Módulo de email (BullMQ)
│       └── integrations/          # Integrações com marketplaces (Shopee)
├── test/                          # Testes E2E
├── .env                           # Variáveis de ambiente
├── .env.example                   # Template de ambiente
├── docker-compose.yaml            # Serviços Docker
├── package.json                   # Dependências
├── tsconfig.json                  # Configuração TypeScript
├── nest-cli.json                  # Configuração NestJS CLI
├── biome.json                     # Configuração Biome linter
└── prisma.config.ts              # Configuração Prisma
```

---

## 4. Configuração do Ambiente

### Variáveis de Ambiente (`.env`)

```env
# Aplicação
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/shopixturbo
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=shopixturbo

# JWT
JWT_SECRET=sua-chave-secreta-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=1d

# Token de Verificação de Email
EMAIL_TOKEN_EXP_IN_PLAIN_TEXT=30 minutes

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
```

### Validação de Ambiente (Zod)

O arquivo `src/configs/env.config.ts` contém schema Zod para validação:

| Variável                        | Tipo                        | Obrigatório | Padrão    |
| ------------------------------- | --------------------------- | ----------- | --------- |
| `NODE_ENV`                      | enum                        | Sim         | -         |
| `PORT`                          | string                      | Não         | 8000      |
| `FRONTEND_URL`                  | string                      | Não         | -         |
| `API_URL`                       | string                      | Não         | -         |
| `DATABASE_URL`                  | url                         | **Sim**     | -         |
| `POSTGRES_USER`                 | string                      | **Sim**     | -         |
| `POSTGRES_PASSWORD`             | string                      | **Sim**     | -         |
| `POSTGRES_DB`                   | string                      | **Sim**     | -         |
| `JWT_SECRET`                    | string (min 32 chars)       | **Sim**     | -         |
| `JWT_EXPIRES_IN`                | regex `/^\d+(s\|m\|h\|d)$/` | Não         | 1d        |
| `EMAIL_TOKEN_EXP_IN_PLAIN_TEXT` | string                      | **Sim**     | -         |
| `REDIS_URL`                     | string                      | Não         | -         |
| `REDIS_HOST`                    | string                      | Não         | localhost |
| `REDIS_PORT`                    | string                      | Não         | 6379      |
| `SMTP_HOST`                     | string                      | Não         | localhost |
| `SMTP_PORT`                     | string                      | Não         | 1025      |
| `SMTP_USER`                     | string                      | Não         | -         |
| `SMTP_PASS`                     | string                      | Não         | -         |

---

## 5. Módulos e Funcionalidades

### 5.1 Módulo de Autenticação (`/auth`)

**Responsabilidades:**

- Registro de usuários com verificação de email
- Login com validação de senha (proteção contra timing attacks)
- Verificação de email via token
- Reenvio de email de verificação
- Geração de tokens JWT

**Arquivos:**

```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.service.spec.ts
├── auth.controller.spec.ts
├── dto/
│   ├── sign-up.dto.ts
│   ├── sign-in.dto.ts
│   └── user-response.dto.ts
└── enums/
    └── verify-email-status.enum.ts
```

**DTOs:**

```typescript
// SignUpDTO
{
  name: string; // @IsString(), @MinLength(2), @MaxLength(100)
  email: string; // @IsEmail()
  password: string; // @IsString(), @MinLength(8), @MaxLength(100)
}

// SignInDTO
{
  email: string; // @IsEmail()
  password: string; // @IsString()
}

// UserResponseDTO
{
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### 5.2 Módulo de Usuários (`/users`)

**Responsabilidades:**

- Operações CRUD de usuários
- Verificação de disponibilidade de email
- Cache de dados de usuários com Redis

**Arquivos:**

```
src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── users.service.spec.ts
├── users.controller.spec.ts
├── users.repository.ts
├── dto/
│   └── user-response.dto.ts
└── interfaces/
    └── user-without-password.interface.ts
```

**Padrão Repository:**
O `UsersRepository` abstrai as chamadas Prisma para melhor testabilidade e separação de responsabilidades.

### 5.3 Módulo de Email (`/mail`)

**Responsabilidades:**

- Configuração de transporte Nodemailer
- Envio de emails com templates HTML
- Anexos de logo
- Processamento assíncrono via BullMQ + Redis

**Arquivos:**

```
src/modules/mail/
├── mail.module.ts
├── mail.service.ts
├── mail.service.spec.ts
├── mail.producer.ts
├── mail.processor.ts
└── templates/
    └── email-verification.template.ts
```

**Configuração de Fila:**

```typescript
{
  attempts: 3,                    // Tentativas de retry
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
  removeOnFail: false
}
```

### 5.4 Módulo de Integrações (`/integrations`)

**Responsabilidades:**

- Placeholder para integrações futuras com marketplaces
- Estrutura para abstração de marketplace

**Arquivos:**

```
src/modules/integrations/
├── integrations.module.ts
├── integrations.interface.ts
└── shopee/
    ├── shopee.module.ts
    └── shopee.service.ts
```

---

## 6. API Endpoints

### Versionamento

- Todas as rotas são prefixadas com `/api/v1`
- Tipo de versionamento: URI

### Documentação

- **Swagger UI:** `http://localhost:8000/api/v1/docs`

---

### Health Check

| Método | Endpoint | Descrição                   | Auth |
| ------ | -------- | --------------------------- | ---- |
| GET    | `/`      | Verificação de saúde da API | Não  |

**Resposta:**

```json
{
  "message": "Documentação disponível em:  /api/v1/docs"
}
```

---

### Autenticação (`/api/v1/auth`)

| Método | Endpoint                          | Descrição                     | Auth    |
| ------ | --------------------------------- | ----------------------------- | ------- |
| POST   | `/auth/signup`                    | Registrar novo usuário        | Não     |
| POST   | `/auth/signin`                    | Login do usuário              | Não     |
| GET    | `/auth/verify-email`              | Verificar email com token     | Não     |
| POST   | `/auth/resend-verification-email` | Reenviar email de verificação | Não     |
| GET    | `/auth/me`                        | Obter perfil do usuário atual | **Sim** |

#### POST /auth/signup

**Request Body:**

```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123456"
}
```

**Resposta (201):**

```json
{
  "message": "Enviamos um email para gil@gmail.com. Verifique sua caixa de entrada para ativar sua conta."
}
```

#### POST /auth/signin

**Request Body:**

```json
{
  "email": "joao@exemplo.com",
  "password": "senha123456"
}
```

**Resposta (200):**

```json
{
  "user_auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /auth/verify-email?token=xxx

**Query Parameters:**

- `token` (string, obrigatório): Token de verificação

**Respostas Possíveis:**

- redirecionado com http status code `303` para a rota do frontend GET "/verification/email?status=verified_email"

#### POST /auth/resend-verification-email

**Request Body:**

```json
{
  "email": "joao@exemplo.com"
}
```

**Resposta (200):**

```json
{
  "message": "Se o email estiver cadastrado, você receberá um novo link de verificação."
}
```

#### GET /auth/me

**Headers:**

```
Authorization: Bearer <user_auth_token>
```

**Resposta (200):**

```json
{
  "id": "uuid-do-usuario",
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "role": "USER",
  "is_email_verified": true,
  "created_at": "2026-03-24T21:53:10.380Z",
  "updated_at": "2026-03-24T21:53:18.800Z"
}
```

---

### Usuários (`/api/v1/users`)

| Método | Endpoint          | Descrição            | Auth    |
| ------ | ----------------- | -------------------- | ------- |
| GET    | `/users/:user_id` | Obter usuário por ID | **Sim** |

#### GET /users/:user_id

**Parâmetros de Path:**

- `user_id` (string, obrigatório): ID do usuário

**Headers:**

```
Authorization: Bearer <user_auth_token>
```

**Resposta (200):**

```json
{
  "id": "uuid-do-usuario",
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "role": "USER",
  "is_email_verified": true,
  "created_at": "2026-03-25T10:00:00.000Z"
}
```

---

## 7. Banco de Dados

### Schema Prisma

**Modelo User:**

```prisma
model User {
  id                                  String    @id @default(uuid())
  name                                String
  email                               String    @unique
  password                            String
  role                                UserRole  @default(USER)
  is_email_verified                   Boolean   @default(false)
  email_verification_token            String?
  email_verification_token_expires_at DateTime?
  created_at                          DateTime  @default(now())
  updated_at                          DateTime  @updatedAt

  @@map("users")
}

enum UserRole {
  USER
  ADMIN
}
```

### Campos de Verificação de Email

| Campo                                 | Tipo      | Descrição                 |
| ------------------------------------- | --------- | ------------------------- |
| `is_email_verified`                   | Boolean   | Se o email foi verificado |
| `email_verification_token`            | String?   | Token hash (SHA256)       |
| `email_verification_token_expires_at` | DateTime? | Expiração do token        |

### Migrações

1. **20260319140048_init** - Cria tabela users com campos básicos
2. **20260321224126_add_email_verification** - Adiciona campos de verificação de email

### Comandos Prisma

```bash
pnpm run prisma:migrate     # Executar migrações
pnpm run prisma:generate    # Gerar cliente Prisma
```

---

## 8. Autenticação e Segurança

### JWT Authentication

**Algoritmo:** HS256  
**Expiração:** Configurável via `JWT_EXPIRES_IN` (padrão: 1d)  
**Validação:** Automaticamente via `JwtAuthGuard`

**Estrutura do Payload:**

```typescript
interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole; // 'USER' | 'ADMIN'
  is_email_verified: boolean;
  iat?: number; // Issued at
  exp?: number; // Expiration
}
```

### Decorator `@CurrentUser()`

```typescript
// Uso no controller
@Get('me')
async me(@CurrentUser() user: TokenPayload) {
  return this.authService.me(user.id);
}
```

### Recursos de Segurança

1. **Helmet** - Headers de segurança HTTP
2. **CORS** - Configurado apenas para URL do frontend
3. **Hash de Senha** - bcrypt com 12 salt rounds
4. **Tokens de Email** - 32 bytes random, hash SHA256
5. **Validação Global** - class-validator em todos os DTOs
6. **JWT Auth Guard** - Extração e validação de Bearer token

### Segurança de Tokens

| Item                   | Valor               |
| ---------------------- | ------------------- |
| Salt Rounds            | 12                  |
| Tamanho do Token Email | 32 bytes (hex)      |
| Expiração Token Email  | 30 minutos (padrão) |
| Algoritmo Hash         | SHA256              |

---

## 9. Filas e Cache

### Redis Service

**Responsabilidades:**

- Operações simples de cache key-value
- Suporte a TTL para dados em cache

**Métodos:**

```typescript
// Obter dado cacheado
async get<T>(key: string): Promise<T | null>

// Definir dado em cache
async set(key: string, value: unknown, ttlSeconds?: number): Promise<void>

// Deletar dado do cache
async delete(key: string): Promise<void>
```

**Configuração de Cache:**

```typescript
// src/configs/cache.config.ts
{
  userTTL: 300,  // 5 minutos para dados de usuário
  defaultTTL: 300
}
```

### BullMQ

**Configuração da Fila de Email:**

```typescript
{
  name: 'mail',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
}
```

---

## 10. Email

### Fluxo de Verificação de Email

1. Usuário se registra → Conta criada com `is_email_verified: false`
2. Token gerado (32 bytes random, hash SHA256)
3. Email enviado via BullMQ com link de verificação
4. Usuário clica no link → Token validado → `is_email_verified: true`

### Configuração SMTP

**Transport Nodemailer:**

```typescript
{
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}
```

### Template de Email

**Localização:** `src/modules/mail/templates/verification-email.hbs`

**Variáveis disponíveis:**

- `{{name}}` - Nome do usuário
- `{{verificationUrl}}` - URL de verificação completa

### Mailpit (Desenvolvimento)

O `docker-compose.yaml` inclui Mailpit para testes de email:

- **SMTP:** `localhost:1025`
- **UI:** `http://localhost:8025`

---

## 11. Testes

### Framework

- **Unit Tests:** Jest
- **E2E Tests:** Jest + Supertest

### Estrutura de Testes

```
src/
├── app.controller.spec.ts           # Testes do controller raiz
└── modules/
    ├── auth/
    │   ├── auth.controller.spec.ts  # Testes do controller auth
    │   └── auth.service.spec.ts     # Testes do service auth
    ├── users/
    │   ├── users.controller.spec.ts
    │   └── users.service.spec.ts
    └── mail/
        └── mail.service.spec.ts

test/
└── app.e2e-spec.ts                 # Testes E2E básicos
```

### Comandos de Teste

```bash
pnpm run test              # Rodar testes unitários
pnpm run test:watch        # Modo watch
pnpm run test:cov          # Com coverage
pnpm run test:e2e          # Testes E2E
```

### Exemplo de Teste

```typescript
// src/app.controller.spec.ts
describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "ShopixTurbo API is running"', () => {
      expect(appController.getHealth()).toEqual({
        statusCode: 200,
        message: 'ShopixTurbo API is running',
        timestamp: expect.any(Date),
      });
    });
  });
});
```

---

## 12. Linting e Formatação

### Biome

**Configuração (`biome.json`):**

```json
{
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "typescript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

### Regras

| Regra           | Valor          |
| --------------- | -------------- |
| Quotes          | Single (`'`)   |
| Trailing Commas | All            |
| Semicolons      | Always         |
| Indent          | 2 spaces       |
| Line Width      | 120 characters |

### Comandos

```bash
pnpm run lint     # Verificar código
pnpm run format   # Formatar código
```

---

## 13. Scripts Disponíveis

### Desenvolvimento

```bash
pnpm run start:dev     # Iniciar em modo desenvolvimento (watch)
pnpm run start:debug   # Iniciar em modo debug (watch)
pnpm run start         # Iniciar em modo produção
```

### Build

```bash
pnpm run build         # Compilar TypeScript
pnpm run start:prod    # Iniciar após build (produção)
```

### Database

```bash
pnpm run prisma:generate   # Gerar cliente Prisma
pnpm run prisma:migrate     # Executar migrações
pnpm run prisma:studio      # Abrir Prisma Studio
```

### Testes

```bash
pnpm run test         # Rodar testes
pnpm run test:watch   # Modo watch
pnpm run test:cov     # Com coverage
pnpm run test:e2e     # Testes E2E
pnpm run test:debug   # Modo debug
```

### Linting

```bash
pnpm run lint     # Verificar código
pnpm run format   # Formatar código
pnpm run check    # Verificar sem fix
```

### Docker

```bash
pnpm run docker:up     # Subir containers
pnpm run docker:down   # Parar containers
pnpm run docker:logs   # Ver logs
```

---

## 14. Padrões e Convenções

### 14.1 Padrão Repository

```typescript
// src/modules/users/users.repository.ts
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
```

### 14.2 Padrão Service

```typescript
// src/modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly mailProducer: MailProducer,
    private readonly jwtService: JwtService,
  ) {}

  async signup(data: SignUpDTO): Promise<{ message: string }> {
    // Lógica de negócio
  }
}
```

### 14.3 Padrão DTO

```typescript
// src/modules/auth/dto/sign-up.dto.ts
export class SignUpDTO {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'joao@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123456' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
```

### 14.4 Decorator Personalizado

```typescript
// src/common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### 14.5 Guard JWT

```typescript
// src/common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 14.6 Estrutura de Módulo

```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.service.spec.ts
├── dto/
│   ├── create.dto.ts
│   └── response.dto.ts
├── enums/
│   └── status.enum.ts
└── interfaces/
    └── module.interface.ts
```

### 14.7 Enum Pattern

```typescript
// src/modules/auth/enums/verify-email-status.enum.ts
export enum VerifyEmailStatus {
  VERIFIED_EMAIL = 'verified_email',
  INVALID_TOKEN = 'invalid_token',
  EXPIRED_TOKEN = 'expired_token',
}
```

---

## 15. Docker Services

### docker-compose.yaml

```yaml
services:
  postgres:
    image: postgres:18
    container_name: shopixturbo-db
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - ./data:/var/lib/postgresql
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    container_name: shopixturbo-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  mailpit:
    image: axllent/mailpit
    container_name: shopixturbo-mailpit
    ports:
      - '1025:1025'
      - '8025:8025'

volumes:
  redis_data:
```

### Comandos Docker

```bash
# Subir todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Ver logs
docker-compose logs -f

# Ver logs de serviço específico
docker-compose logs -f postgres
```

### Portas

| Serviço      | Porta Externa | Porta Interna |
| ------------ | ------------- | ------------- |
| PostgreSQL   | 5432          | 5432          |
| Redis        | 6379          | 6379          |
| Mailpit SMTP | 1025          | 1025          |
| Mailpit UI   | 8025          | 8025          |
| API          | 8000          | 8000          |

---

## Constantes da Aplicação

**Arquivo:** `src/configs/constants.config.ts`

```typescript
{
  SALT_PASSWORD: 12,                          // Salt rounds para bcrypt
  TOKEN_EXP_IN_PLAIN_TEXT: '30 minutos',      // Expiração do token em texto
  APPLICATION_NAME: 'ShopixTurbo',            // Nome da aplicação
  MAIL_QUEUE: 'mail',                         // Nome da fila BullMQ
  SEND_VERIFICATION_EMAIL_JOB: 'send-verification-email'  // Nome do job
}
```

---

## URLs de Referência

| Recurso       | URL                                 |
| ------------- | ----------------------------------- |
| API Base      | `http://localhost:8000/api/v1`      |
| Swagger UI    | `http://localhost:8000/api/v1/docs` |
| Prisma Studio | `pnpm run prisma:studio`            |
| Mailpit UI    | `http://localhost:8025`             |

---

## Fluxo de Registro e Verificação

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Cliente   │────▶│  POST/signup │────▶│ AuthService │────▶│ MailProducer │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                                                                  │
                                                                  ▼
                                                           ┌─────────────┐
                                                           │  BullMQ     │
                                                           │   Queue     │
                                                           └─────────────┘
                                                                  │
                                                                  ▼
                                                           ┌─────────────┐
                                                           │   Mailpit   │
                                                           │   (SMTP)    │
                                                           └─────────────┘

┌─────────────┐     ┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Cliente   │◀────│ GET/verify-email│◀────│  AuthService │◀────│   Token     │
│   (Email)   │     │    ?token=xxx   │     │verifyEmail() │     │  Validation │
└─────────────┘     └─────────────────┘     └──────────────┘     └─────────────┘
```

---

**Mantenha SKILLS.md, AGENTS.md e README.md sempre atualizados**
