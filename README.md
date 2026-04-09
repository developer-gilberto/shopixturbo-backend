<p align="center">
    <img src="./assets/logo-full-shopixturbo-1536x1024.png" width="640" height="auto" alt="ShopixTurbo" />
</p>

**A documentação também está disponível via Swagger na rota GET /api/v1/docs**

# ShopixTurbo Backend

Uma API RESTful para fazer a integração e consumo da API oficial da Shopee e futuramente outros marketplaces.

## ⚠️ Antes de continuar

Este projeto ainda está em desenvolvimento, se você encontrar algum problema, comportamento inesperado, bugs, por favor reporte o problema ao desenvolvedor:

Ao reportar, inclua:

- Passos para reproduzir o bug
- O que você esperava que acontecesse
- O que realmente aconteceu
- Logs ou prints se possível

👉 [Reportar bug ao desenvolvedor](https://github.com/developer-gilberto/shopixturbo-backend/issues/new)

## Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando a Aplicação](#executando-a-aplicação)
- [API e Documentação](#api-e-documentação)
- [Banco de Dados](#banco-de-dados)
- [Filas e Cache](#filas-e-cache)
- [Testes](#testes)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Segurança](#segurança)
- [Desenvolvimento](#desenvolvimento)
- [Deploy](#deploy)

---

## Documentação para IA

Este projeto utiliza **OpenCode** com agentes e skills especializados:

| Arquivo                                 | Propósito                       |
| --------------------------------------- | ------------------------------- |
| `.opencode/agents/core-rules.md`        | Regras, padrões e proibições    |
| `.opencode/skills/docs-writer/SKILL.md` | Workflow de atualização de docs |

> **Para IA/Desenvolvedores:** Sempre siga as regras definidas em `core-rules.md` ao fazer alterações no código.

---

## Sobre o Projeto

ShopixTurbo Backend é uma API RESTful desenvolvida com NestJS para integração e consumo da API oficial da Shopee. O projeto foi arquitetado para suportar múltiplos marketplaces no futuro, oferecendo uma camada de abstração robusta para operações de e-commerce.

### Funcionalidades Principais

- **Autenticação de Usuários**: Registro, login com JWT e verificação de e-mail
- **Gestão de Usuários**: CRUD completo com proteção por roles
- **Envio de E-mails**: Sistema de filas com BullMQ para envio assíncrono
- **Documentação API**: Swagger/OpenAPI integrado com autenticação
- **Validação de Dados**: Pipes globais de validação com class-validator
- **Queue System**: Processamento assíncrono de tarefas com Redis

---

## Tecnologias

| Categoria       | Tecnologia      | Versão          |
| --------------- | --------------- | --------------- |
| Framework       | NestJS          | ^11.0.1         |
| Linguagem       | TypeScript      | ^5.7.3          |
| Banco de Dados  | PostgreSQL      | 18              |
| ORM             | Prisma          | ^7.5.0          |
| Fila/Cache      | Redis + BullMQ  | 7               |
| Documentação    | Swagger/OpenAPI | @nestjs/swagger |
| E-mail          | Nodemailer      | ^8.0.3          |
| Autenticação    | JWT             | @nestjs/jwt     |
| Validação       | class-validator | Latest          |
| Segurança       | Helmet          | ^8.1.0          |
| Linting         | Biome           | 2.4.5           |
| Testes          | Jest            | ^30.0.0         |
| Package Manager | pnpm            | 10.30.3         |

---

## Estrutura do Projeto

```
shopixturbo-backend/
├── .opencode/                      # Configuração OpenCode (IA)
│   ├── agents/                     # Agentes de regras
│   │   └── core-rules.md           # Regras e padrões do projeto
│   └── skills/                     # Skills especializadas
│       └── docs-writer/            # Workflow de documentação
├── assets/                         # Assets estáticos (logos, imagens)
├── data/                           # Dados PostgreSQL (volume Docker)
├── prisma/                         # Schema e migrations do banco
│   ├── migrations/                 # Migrations do banco de dados
│   └── schema.prisma               # Definição do schema Prisma
├── src/                            # Código fonte
│   ├── main.ts                     # Ponto de entrada da aplicação
│   ├── app.module.ts               # Módulo raiz
│   ├── app.controller.ts           # Controller raiz (health check)
│   ├── app.service.ts              # Serviço raiz
│   ├── configs/                    # Configurações
│   │   ├── env.schema.ts           # Validação Zod de env vars
│   │   ├── constants.config.ts     # Constantes da aplicação
│   │   └── cache.config.ts         # Configuração de cache Redis
│   ├── database/                   # Serviços de banco
│   │   ├── database.module.ts      # Módulo de banco
│   │   ├── prisma.service.ts       # Prisma ORM service
│   │   └── redis.service.ts        # Redis service (cache)
│   ├── common/                     # Utilitários compartilhados
│   │   ├── decorators/             # Decorators (@CurrentUser, etc)
│   │   ├── guards/                 # Guards (JwtAuthGuard)
│   │   ├── types/                  # Types (TokenPayload)
│   │   └── encryption/             # Utilitários de criptografia
│   ├── modules/                    # Módulos de features
│   │   ├── auth/                   # Módulo de autenticação
│   │   ├── users/                  # Módulo de usuários
│   │   ├── mail/                   # Módulo de e-mail (BullMQ)
│   │   ├── shops/                  # Módulo de lojas (Shopee)
│   │   └── integrations/           # Módulo de integrações
│   └── generated/                  # Cliente Prisma gerado
├── test/                           # Testes E2E
├── .env                            # Variáveis de ambiente
├── .env.example                    # Template de variáveis
├── .env.test                       # Variáveis para testes
├── biome.json                      # Configuração do Biome
├── docker-compose.yaml             # Serviços Docker
├── nest-cli.json                   # Configuração NestJS CLI
├── package.json                    # Dependências e scripts
├── prisma.config.ts                # Configuração Prisma
├── README.md                       # Documentação do projeto
└── tsconfig.json                   # Configuração TypeScript
```

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 20.x ou superior)
- **pnpm** (gerenciador de pacotes)
- **Docker** e **Docker Compose** (para banco de dados e serviços)
- **PostgreSQL** 18 (ou via Docker)
- **Redis** 7 (ou via Docker)

---

## Instalação

1. **Clone o repositório:**

```bash
git clone https://github.com/developer-gilberto/shopixturbo-backend
cd shopixturbo-backend
```

2. **Instale as dependências:**

```bash
pnpm install
```

3. **Configure as variáveis de ambiente:**

```bash
cp .env.example .env
```

4. **Inicie os serviços Docker:**

```bash
docker-compose up -d
```

5. **Execute as migrations do banco de dados:**

```bash
pnpm run prisma:migrate
```

---

## Configuração

### Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```env
# Ambiente
NODE_ENV=development

# Servidor
SERVER_PORT=8000

# URLs
BASE_API_URL=http://localhost:8000/api/v1
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=sua_chave_super_secreta_com_mais_de_32_chars
JWT_EXPIRES_IN=1d

# Encryption
ENCRYPTION_KEY=string_com_64_caracteres

# Banco de dados
DATABASE_URL=postgresql://postgres:1234@localhost:5432/shopixturbo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=1234
POSTGRES_DB=shopixturbo

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# Shopee
SHOPEE_PARTNER_ID=123456
SHOPEE_PARTNER_KEY=mock-partner-key-for-testing
SHOPEE_MAIN_ACCOUNT_ID=123456
SHOPEE_AUTH_PARTNER_HOST=https://openplatform.sandbox.test-stable.shopee.sg
REDIRECT_URL=frontend_url

# Paths da API Shopee
AUTHORIZATION_URL_PATH=/api/v2/shop/auth_partner
GET_ACCESS_TOKEN_PATH=/api/v2/auth/token/get
GET_REFRESH_TOKEN_PATH=/api/v2/auth/access_token/get
GET_SHOP_INFO_PATH=/api/v2/shop/get_shop_info
GET_SHOP_PROFILE_PATH=/api/v2/shop/get_profile
GET_ITEM_LIST_PATH=/api/v2/product/get_item_list
GET_ITEM_BASE_INFO_PATH=/api/v2/product/get_item_base_info
GET_ORDER_LIST_PATH=/api/v2/order/get_order_list
GET_ORDER_DETAIL_PATH=/api/v2/order/get_order_detail
```

### Descrição das Variáveis

| Variável                   | Descrição                                                  | Padrão                   |
| -------------------------- | ---------------------------------------------------------- | ------------------------ |
| **Ambiente**               |
| `NODE_ENV`                 | Ambiente de execução (`development`, `production`, `test`) | `development`            |
| **Servidor**               |
| `SERVER_PORT`              | Porta do servidor HTTP                                     | `8000`                   |
| **URLs**                   |
| `BASE_API_URL`             | URL base da API                                            | -                        |
| `FRONTEND_URL`             | URL do frontend para CORS                                  | `http://localhost:3000`  |
| **JWT**                    |
| `JWT_SECRET`               | Chave secreta para assinatura JWT (mín. 32 caracteres)     | -                        |
| `JWT_EXPIRES_IN`           | Tempo de expiração do token JWT                            | `1d`                     |
| **Criptografia**           |
| `ENCRYPTION_KEY`           | Chave para criptografia AES-256 (64 caracteres)            | -                        |
| **Banco de Dados**         |
| `DATABASE_URL`             | String de conexão PostgreSQL completa                      | -                        |
| `POSTGRES_USER`            | Usuário do PostgreSQL                                      | -                        |
| `POSTGRES_PASSWORD`        | Senha do PostgreSQL                                        | -                        |
| `POSTGRES_DB`              | Nome do banco de dados                                     | -                        |
| **Redis**                  |
| `REDIS_URL`                | URL completa de conexão Redis                              | `redis://localhost:6379` |
| `REDIS_HOST`               | Host do Redis                                              | `localhost`              |
| `REDIS_PORT`               | Porta do Redis                                             | `6379`                   |
| **SMTP**                   |
| `SMTP_HOST`                | Host do servidor SMTP                                      | `localhost`              |
| `SMTP_PORT`                | Porta do servidor SMTP                                     | `1025`                   |
| `SMTP_USER`                | Usuário do SMTP                                            | -                        |
| `SMTP_PASS`                | Senha do SMTP                                              | -                        |
| **Shopee**                 |
| `SHOPEE_PARTNER_ID`        | ID do parceiro na API Shopee                               | -                        |
| `SHOPEE_PARTNER_KEY`       | Chave do parceiro na API Shopee                            | -                        |
| `SHOPEE_MAIN_ACCOUNT_ID`   | ID da conta principal Shopee                               | -                        |
| `SHOPEE_AUTH_PARTNER_HOST` | Host de autenticação da Shopee                             | -                        |
| `REDIRECT_URL`             | URL de redirecionamento após autenticação                  | -                        |
| **Paths da API Shopee**    |
| `AUTHORIZATION_URL_PATH`   | Path para autorização de loja                              | -                        |
| `GET_ACCESS_TOKEN_PATH`    | Path para obter access token                               | -                        |
| `GET_REFRESH_TOKEN_PATH`   | Path para atualizar access token                           | -                        |
| `GET_SHOP_INFO_PATH`       | Path para obter informações da loja                        | -                        |
| `GET_SHOP_PROFILE_PATH`    | Path para obter perfil da loja                             | -                        |
| `GET_ITEM_LIST_PATH`       | Path para listar produtos                                  | -                        |
| `GET_ITEM_BASE_INFO_PATH`  | Path para obter info base de produtos                      | -                        |
| `GET_ORDER_LIST_PATH`      | Path para listar pedidos                                   | -                        |
| `GET_ORDER_DETAIL_PATH`    | Path para obter detalhe de pedido                          | -                        |

---

## Executando a Aplicação

```bash
# Desenvolvimento (com watch mode)
pnpm run start:dev

# Produção
pnpm run build
pnpm run start:prod

# Modo debug
pnpm run start:debug
```

---

## API e Documentação

### Swagger UI

A documentação interativa da API está disponível em:

```
http://localhost:8000/api/v1/docs
```

### Endpoints Principais

#### Autenticação (`/api/v1/auth`)

| Método | Endpoint                          | Descrição                      | Auth |
| ------ | --------------------------------- | ------------------------------ | ---- |
| POST   | `/auth/signup`                    | Registrar novo usuário         | Não  |
| POST   | `/auth/signin`                    | Login de usuário               | Não  |
| GET    | `/auth/verify-email`              | Verificar e-mail com token     | Não  |
| POST   | `/auth/resend-verification-email` | Reenviar e-mail de verificação | Não  |

#### Usuários (`/api/v1/users`)

| Método | Endpoint          | Descrição            | Auth      |
| ------ | ----------------- | -------------------- | --------- |
| GET    | `/users/:user_id` | Obter usuário por ID | Sim (JWT) |

#### Health Check

| Método | Endpoint | Descrição                   | Auth |
| ------ | -------- | --------------------------- | ---- |
| GET    | `/`      | Verificação de saúde da API | Não  |

#### Lojas (`/api/v1/shops`)

| Método | Endpoint                  | Descrição                     | Auth      |
| ------ | ------------------------- | ----------------------------- | --------- |
| GET    | `/shops/info/:shop_id`    | Obter informações da loja     | Sim (JWT) |
| GET    | `/shops/profile/:shop_id` | Obter perfil da loja          | Sim (JWT) |
| GET    | `/shops/full/:shop_id`    | Obter dados completos da loja | Sim (JWT) |

### Exemplo de Uso

**Registro de Usuário:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "password": "senha123"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@exemplo.com",
    "password": "senha123"
  }'
```

---

## Banco de Dados

### Schema Prisma

O projeto utiliza Prisma ORM com PostgreSQL. O schema principal define o modelo de usuário:

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

### Migrations

As migrations são gerenciadas via Prisma:

```bash
# Criar nova migration
pnpm run prisma:migrate

# Gerar cliente Prisma
pnpm run prisma:generate

# Resetar banco (cuidado: apaga dados)
npx prisma migrate reset
```

### Serviços Docker

O `docker-compose.yaml` inclui:

| Serviço    | Imagem          | Portas     | Propósito                 |
| ---------- | --------------- | ---------- | ------------------------- |
| `postgres` | postgres:18     | 5432       | Banco de dados            |
| `redis`    | redis:7-alpine  | 6379       | Fila e Cache              |
| `mailpit`  | axllent/mailpit | 1025, 8025 | Servidor SMTP para testes |

---

## Filas e Cache

### BullMQ Integration

O projeto utiliza BullMQ com Redis para processamento assíncrono de tarefas:

**Mail Queue:**

- **Produtor** (`mail.producer.ts`): Adiciona jobs à fila
- **Processador** (`mail.processor.ts`): Processa os jobs da fila

**Configurações:**

- Retry: 3 tentativas
- Backoff: Exponencial
- Remove on complete: Sim
- Remove on fail: Não

---

## Testes

### Testes Unitários

```bash
# Executar todos os testes
pnpm run test

# Modo watch
pnpm run test:watch

# Com cobertura
pnpm run test:cov
```

### Testes E2E

```bash
pnpm run test:e2e
```

### Estrutura dos Testes

- **Unitários**: Arquivos `*.spec.ts` junto aos módulos
- **E2E**: Diretório `test/` com configuração em `jest-e2e.json`

---

## Scripts Disponíveis

| Script                     | Descrição                      |
| -------------------------- | ------------------------------ |
| `pnpm run build`           | Compila o projeto              |
| `pnpm run start`           | Inicia o servidor              |
| `pnpm run start:dev`       | Inicia em modo desenvolvimento |
| `pnpm run start:debug`     | Inicia em modo debug           |
| `pnpm run start:prod`      | Inicia em produção             |
| `pnpm run lint`            | Executa o linter Biome         |
| `pnpm run format`          | Formata código com Biome       |
| `pnpm run test`            | Executa testes unitários       |
| `pnpm run test:watch`      | Executa testes em watch mode   |
| `pnpm run test:cov`        | Executa testes com cobertura   |
| `pnpm run test:e2e`        | Executa testes E2E             |
| `pnpm run prisma:generate` | Gera cliente Prisma            |
| `pnpm run prisma:migrate`  | Executa migrations             |

---

## Segurança

O projeto implementa múltiplas camadas de segurança:

1. **Helmet**: Headers HTTP de segurança
2. **CORS**: Configurado para permitir apenas origens do frontend
3. **JWT Authentication**: Validação de tokens Bearer
4. **Password Hashing**: bcrypt com 12 rounds de salt
5. **Email Tokens**: Tokens hash com SHA256
6. **Validation Pipes**: Validação global de payloads de requisição

---

## Desenvolvimento

### Linting e Formatação

O projeto utiliza Biome para linting e formatação:

```bash
# Verificar código
pnpm run lint

# Formatar código
pnpm run format
```

### Configuração Biome

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.5/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 120
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  }
}
```

---

## 🧑‍💻 Desenvolvedor

Feito com muito ❤️ por **Gilberto Lopes** Full Stack Developer.

### Saiba mais sobre o desenvolvedor

- Email: developer.gilberto@gmail.com
- [Site pessoal](https://gilbertolopes.dev)
- [LinkedIn](https://linkedin.com/in/gilbertolopes-dev)
- [GitHub](https://github.com/developer-gilberto)
- [Instagran](https://www.instagram.com/developer.gilberto/)

## Licença e Direitos

### ShopixTurbo 🚀

**Exceto conforme expressamente estabelecido de outra forma por escrito, o titular dos direitos autorais deste software e qualquer outra pessoa que controle os direitos autorais reserva todos os direitos a respeito do software distribuído.**

**Nenhuma permissão é concedida para cópia, distribuição, modificação ou sublicenciamento do software. O uso comercial deste software requer uma licença comercial válida emitida pelo titular dos direitos autorais.**

**Para obter permissão, entre em contato com o criador e desenvolvedor do ShopixTurbo® Gilberto Lopes developer.gilberto@gmail.com**

ShopixTurbo®
All Rights Reserved®
© Copy Right
Todos os Direitos Reservados
