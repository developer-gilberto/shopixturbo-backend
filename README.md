<p align="center">
    <img src="./assets/logo-full-shopixturbo-1536x1024.png" width="640" height="auto" alt="ShopixTurbo" />
</p>

**A documentação também está disponível via Swagger na rota GET /api/v1/docs**

# ShopixTurbo Backend

Uma API RESTful para fazer a integração e consumo da API oficial da Shopee e futuramente outros marketplaces.

## ⚠️ Antes de continuar

Este projeto ainda está em desenvolvimento, se você encontrar algum problema, comportamento inesperado, bugs, por favor reporte o problema ao desenvolvedor:

Ao reportar, inclua:

-   Passos para reproduzir o bug
-   O que você esperava que acontecesse
-   O que realmente aconteceu
-   Logs ou prints se possível

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

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| Framework | NestJS | ^11.0.1 |
| Linguagem | TypeScript | ^5.7.3 |
| Banco de Dados | PostgreSQL | 18 |
| ORM | Prisma | ^7.5.0 |
| Fila/Cache | Redis + BullMQ | 7 |
| Documentação | Swagger/OpenAPI | @nestjs/swagger |
| E-mail | Nodemailer | ^8.0.3 |
| Autenticação | JWT | @nestjs/jwt |
| Validação | class-validator | Latest |
| Segurança | Helmet | ^8.1.0 |
| Linting | Biome | 2.4.5 |
| Testes | Jest | ^30.0.0 |
| Package Manager | pnpm | 10.30.3 |

---

## Estrutura do Projeto

```
shopixturbo-backend/
├── assets/                          # Assets estáticos (logos, imagens)
├── data/                           # Dados PostgreSQL (volume Docker)
├── prisma/                         # Schema e migrations do banco
│   ├── migrations/                  # Migrations do banco de dados
│   └── schema.prisma                # Definição do schema Prisma
├── src/                            # Código fonte
│   ├── main.ts                      # Ponto de entrada da aplicação
│   ├── app.module.ts                # Módulo raiz
│   ├── app.controller.ts            # Controller raiz (health check)
│   ├── app.service.ts               # Serviço raiz
│   ├── configs.ts                   # Configurações de ambiente
│   ├── prisma.service.ts            # Serviço do Prisma
│   └── modules/                     # Módulos de features
│       ├── auth/                    # Módulo de autenticação
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.dto.ts
│       │   ├── auth.module.ts
│       │   ├── auth.guard.ts
│       │   ├── auth.controller.spec.ts
│       │   ├── auth.service.spec.ts
│       │   └── verify-email-status.enum.ts
│       ├── users/                   # Módulo de usuários
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── users.repository.ts
│       │   ├── users.dto.ts
│       │   ├── users.module.ts
│       │   ├── users.controller.spec.ts
│       │   └── users.service.spec.ts
│       └── mail/                    # Módulo de e-mail
│           ├── mail.module.ts
│           ├── mail.service.ts
│           ├── mail.producer.ts
│           ├── mail.processor.ts
│           ├── mail.service.spec.ts
│           └── templates/
│               └── email-verification.template.ts
├── test/                           # Testes E2E
├── .env                            # Variáveis de ambiente
├── .env.example                    # Exemplo de variáveis
├── .gitignore                      # Regras do git
├── biome.json                      # Configuração do Biome
├── docker-compose.yaml             # Serviços Docker
├── nest-cli.json                   # Configuração NestJS CLI
├── package.json                    # Dependências e scripts
├── prisma.config.ts                # Configuração Prisma
├── tsconfig.json                   # Configuração TypeScript
└── tsconfig.build.json             # Configuração TypeScript para build
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
PORT=8000

# URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000/api/v1

# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shopixturbo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=shopixturbo

# Autenticação JWT
JWT_SECRET=sua_chave_secreta_aqui

# Expiração do Token de Verificação por extenso
EMAIL_VERIFICATION_TOKEN_EXPIRATION_IN_TEXT=30 minutos

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP (Mailpit para desenvolvimento)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
```

### Descrição das Variáveis

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente de execução | `development` |
| `PORT` | Porta do servidor | `8000` |
| `FRONTEND_URL` | URL do frontend para CORS | `http://localhost:3000` |
| `API_URL` | URL base da API | `http://localhost:8000/api/v1` |
| `DATABASE_URL` | String de conexão PostgreSQL | - |
| `JWT_SECRET` | Chave secreta para JWT | - |
| `EMAIL_VERIFICATION_TOKEN_EXPIRATION_IN_TEXT` | Expiração do token | `30 minutos` |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `SMTP_HOST` | Host do servidor SMTP | `localhost` |
| `SMTP_PORT` | Porta do SMTP | `1025` |

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

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/signup` | Registrar novo usuário | Não |
| POST | `/auth/signin` | Login de usuário | Não |
| GET | `/auth/verify-email` | Verificar e-mail com token | Não |
| POST | `/auth/resend-verification-email` | Reenviar e-mail de verificação | Não |

#### Usuários (`/api/v1/users`)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/users/:user_id` | Obter usuário por ID | Sim (JWT) |

#### Health Check

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/` | Verificação de saúde da API | Não |

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

| Serviço | Imagem | Portas | Propósito |
|---------|--------|--------|-----------|
| `postgres` | postgres:18 | 5432 | Banco de dados |
| `redis` | redis:7-alpine | 6379 | Fila e Cache |
| `mailpit` | axllent/mailpit | 1025, 8025 | Servidor SMTP para testes |

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

| Script | Descrição |
|--------|-----------|
| `pnpm run build` | Compila o projeto |
| `pnpm run start` | Inicia o servidor |
| `pnpm run start:dev` | Inicia em modo desenvolvimento |
| `pnpm run start:debug` | Inicia em modo debug |
| `pnpm run start:prod` | Inicia em produção |
| `pnpm run lint` | Executa o linter Biome |
| `pnpm run format` | Formata código com Biome |
| `pnpm run test` | Executa testes unitários |
| `pnpm run test:watch` | Executa testes em watch mode |
| `pnpm run test:cov` | Executa testes com cobertura |
| `pnpm run test:e2e` | Executa testes E2E |
| `pnpm run prisma:generate` | Gera cliente Prisma |
| `pnpm run prisma:migrate` | Executa migrations |

---

## Segurança

O projeto implementa múltiplas camadas de segurança:

1. **Helmet**: Headers HTTP de segurança
2. **CORS**: Configurado para permitir apenas origens do frontend
3. **JWT Authentication**: Validação de tokens Bearer
4. **Password Hashing**: bcrypt com 12 rounds de salt
5. **Email Tokens**: Tokens hash com SHA256
6. **Validation Pipes**: Validação global de payloads de requisição
7. **Rate Limiting**: Proteção contra abuse (configurável)

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

## Deploy

### Desenvolvimento Local

```bash
# 1. Instalar dependências
pnpm install

# 2. Iniciar serviços Docker
docker-compose up -d

# 3. Executar migrations
pnpm run prisma:migrate

# 4. Iniciar em modo dev
pnpm run start:dev
```

### Produção

```bash
# 1. Build
pnpm run build

# 2. Definir variáveis de produção
export NODE_ENV=production
export DATABASE_URL=postgresql://user:pass@host:5432/shopixturbo

# 3. Iniciar em produção
pnpm run start:prod
```

### Variáveis de Produção Obrigatórias

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET` (forte e único)
- `REDIS_HOST`
- `SMTP_HOST` e `SMTP_PORT` (servidor real)

---

## 🧑‍💻 Desenvolvedor

Feito com muito ❤️ por **Gilberto Lopes** Full Stack Developer.

### Saiba mais sobre o desenvolvedor

-   Email: developer.gilberto@gmail.com
-   [Site pessoal](https://gilbertolopes.dev)
-   [LinkedIn](https://linkedin.com/in/gilbertolopes-dev)
-   [GitHub](https://github.com/developer-gilberto)
-   [Instagran](https://www.instagram.com/developer.gilberto/)

## Licença e Direitos

### ShopixTurbo 🚀

**Exceto conforme expressamente estabelecido de outra forma por escrito, o titular dos direitos autorais deste software e qualquer outra pessoa que controle os direitos autorais reserva todos os direitos a respeito do software distribuído.**

**Nenhuma permissão é concedida para cópia, distribuição, modificação ou sublicenciamento do software. O uso comercial deste software requer uma licença comercial válida emitida pelo titular dos direitos autorais.**

**Para obter permissão, entre em contato com o criador e desenvolvedor do ShopixTurbo® Gilberto Lopes developer.gilberto@gmail.com**

ShopixTurbo®
All Rights Reserved®
© Copy Right
Todos os Direitos Reservados
