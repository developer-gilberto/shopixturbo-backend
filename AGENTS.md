## 📌 Objetivo

Este documento define as regras, padrões e decisões arquiteturais deste projeto (**ShopixTurbo**).
Toda inteligência artificial ou desenvolvedor deve seguir estas diretrizes para manter consistência, segurança e escalabilidade.

---

## 🏗️ Stack Oficial

### Backend

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ

---

## 📁 Estrutura do Backend

- O projeto segue arquitetura modular do NestJS

Cada domínio deve conter:

- `*.controller.ts` → Recebe requisições HTTP (sem regra de negócio)
- `*.service.ts` → regra de negócio, lógica de aplicação
- `*.repository.ts` → acesso ao banco de dados via Prisma
- `*.module.ts` → organização do módulo
- `*.dto.ts` → validação e tipagem de entrada
- `*.spec.ts` → testes unitários e de integração

### Regras importantes

- Controllers NÃO devem conter lógica de negócio
- Services NÃO devem acessar diretamente request/response
- Repository é a única camada que deve interagir com o banco de dados
- Regras devem ser reutilizáveis
- Sempre analisar o código gerado em busca de vulnerabilidades e informar caso for encontrada
- Nunca acessar `process.env` diretamente fora de configs/

---

## Commands

| Command                | Script                               | Description                                      |
| ---------------------- | ------------------------------------ | ------------------------------------------------ |
| `pnpm prisma:generate` | `pnpm exec prisma generate`          | Gera o cliente Prisma baseado no schema          |
| `pnpm prisma:migrate`  | `pnpm exec prisma migrate deploy`    | Aplica migrações pendentes ao banco PostgreSQL   |
| `pnpm build`           | `nest build`                         | Compila TypeScript para JavaScript (pasta dist/) |
| `pnpm format`          | `biome format --write .`             | Formata código com Biome (auto-fix)              |
| `pnpm start`           | `nest start`                         | Inicia a aplicação em modo produção              |
| `pnpm start:dev`       | `nest start --watch`                 | Inicia em modo de desenvolvimento com hot-reload |
| `pnpm start:debug`     | `nest start --debug --watch`         | Like dev + debug mode do Node                    |
| `pnpm start:prod`      | `node dist/main.js`                  | Roda o bundle compilado                          |
| `pnpm lint`            | `biome check`                        | Análise estática com Biome (sem auto-fix)        |
| `pnpm test`            | `jest`                               | Executa todos os testes (Jest)                   |
| `pnpm test:watch`      | `jest --watch`                       | Executa testes em modo watch                     |
| `pnpm test:cov`        | `jest --coverage`                    | Executa testes e gera relatório de cobertura     |
| `pnpm test:e2e`        | `jest --config ./test/jest-e2e.json` | Executa testes end-to-end                        |

---

## Workflow

1. Entender a tarefa
2. Escrever testes primeiro (TDD)
3. Implementar
4. Rodar `typecheck` + `test` + `lint`
5. Depois de todos os testes passarem, tarefa concluída

---

## ⚙️ Validação e Configuração

- Variáveis de ambiente devem ser validadas via arquivos de configuração (`env.config.ts`, etc.)
- Nunca acessar `process.env` diretamente fora da camada de config
- Dados de entrada devem ser validados (DTO ou Zod)
- Parâmetros de url e requisições devem ser escritos em snake_case

---

## 🔐 Segurança

- Senhas devem ser criptografadas (bcrypt)
- Nunca retornar mensagens que permitam enumeração de usuários
- Tokens devem ter expiração definida
- Dados sensíveis nunca devem ser expostos

---

## 🔑 Autenticação

- Baseada em JWT
- Guards devem ser usados para proteger rotas
- Payload do token deve ser tipado (`TokenPayload`)
- Nunca confiar em dados vindos do cliente

---

## 📬 Filas (BullMQ)

- Toda operação pesada deve ser feita via fila
  - envio de email
  - tarefas assíncronas

### Regras

- Jobs devem ser idempotentes
- Sempre configurar retry
- Processadores devem ser isolados (`*.processor.ts`)
- Producers devem ser usados para disparar jobs (`*.producer.ts`)

---

## ⚡ Cache (Redis)

- Redis é usado para:
  - cache
  - suporte a filas

### Regras

- Definir TTL sempre que possível
- Evitar cache de dados sensíveis
- Nomear chaves de forma padronizada:
  - `user:{id}`
  - `auth:{token}`

---

## 🗄️ Banco de Dados (PostgreSQL)

- Modelagem relacional
- Evitar queries duplicadas ou desnecessárias
- Acesso ao banco deve ocorrer apenas via repository

### Regras

- Os nomes de todas as tabelas, colunas e linhas devem ser escritas no banco de dados em snake_case

---

## 📧 Sistema de Email

- Envio de email deve ocorrer via fila (NUNCA direto na request)
- Templates devem ser HTML responsivo
- Tokens de verificação devem expirar
- Implementar reenvio com segurança

---

## 📦 Padrão de Código

- TypeScript obrigatório (evitar `any`)
- Nomes claros e descritivos
- Funções com responsabilidade única
- Código deve ser legível antes de ser “inteligente”

---

## 🧾 Padrão de Commits

Seguir Conventional Commits:

- feat: nova funcionalidade
- fix: correção de bug
- refactor: refatoração
- chore: tarefas internas
- docs: documentação

---

## 🚫 Proibições

- ❌ Não usar `any` — use `unknown` e narrowing
- ❌ Não colocar regra de negócio em controller
- ❌ Não acessar banco fora de repository
- ❌ Não enviar email fora de fila
- ❌ Não acessar `process.env` diretamente
- ❌ Não expor dados sensíveis
- ❌ Não apagar dados do banco de dados
- ❌ Não instalar ou desinstalar nada sem a aprovação do usuário (desenvolvedor)

---

## Testes

- Sempre use variáveis de ambiente nos testes com valores falsos/mockados no arquivo .env.test

---

## 📈 Evolução Esperada

- Testes automatizados (unitários, integração e e2e)
- Rate limiting
- Cache em endpoints necessários
- Monitoramento e logs estruturados
- CI/CD
- Deploy em cloud

---

## 🧠 Observação Final

Este projeto segue padrões de nível profissional.
Qualquer alteração estrutural deve atualizar este documento(AGENTS.md), SKILL.md e README.md.
