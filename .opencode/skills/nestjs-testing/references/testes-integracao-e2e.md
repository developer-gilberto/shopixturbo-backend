# Testes de Integração e E2E em NestJS

Diferença chave em relação ao unitário: aqui a integração real entre camadas é o que está sendo verificado, então mockar de menos é o objetivo (só mockar a borda externa: banco, serviços de terceiros).

## Integração (sem subir o servidor HTTP)

Usa `TestingModule` com as camadas internas reais (controller + service + repository real), mas o banco pode ser um banco de teste real (Postgres/Mongo em container) ou in-memory.

```typescript
describe('UsersModule (integração)', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST,
          database: 'test_db',
          entities: [User],
          synchronize: true, // ok em ambiente de teste, nunca em produção
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UsersService],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(async () => {
    await repository.clear(); // limpa estado entre testes
  });

  afterAll(async () => {
    await module.close();
  });

  it('deve persistir e recuperar um usuário criado', async () => {
    const criado = await service.create({ nome: 'Ana', email: 'ana@teste.com' });

    const encontrado = await service.findById(criado.id);

    expect(encontrado?.email).toBe('ana@teste.com');
  });
});
```

Pontos importantes:
- `afterEach` limpando o banco evita que um teste dependa do estado deixado por outro — isso é a causa mais comum de "teste que passa sozinho mas falha no CI".
- `module.close()` no `afterAll` fecha conexões (banco, etc.) — sem isso o Jest pode travar ou dar warning de handle aberto.
- Preferir banco de teste real (via Testcontainers, ou um serviço no `docker-compose` de teste) a mocks de repository quando o objetivo é validar queries reais, constraints, migrations. Mock de repository é para teste unitário, não integração.

## E2E (endpoint HTTP completo)

Sobe a aplicação NestJS de verdade e faz requisições HTTP reais com `supertest`, validando pipes globais, guards, filtros de exceção e serialização, exatamente como em produção.

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true })); // replicar config real do main.ts
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users deve criar um usuário e retornar 201', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/users')
      .send({ nome: 'Ana', email: 'ana@teste.com' })
      .expect(201);

    expect(resposta.body).toMatchObject({ nome: 'Ana', email: 'ana@teste.com' });
    expect(resposta.body.password).toBeUndefined(); // garante que dado sensível não vaza na resposta
  });

  it('POST /users deve retornar 400 quando o email é inválido', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ nome: 'Ana', email: 'não-é-email' })
      .expect(400);
  });

  it('GET /users/:id deve retornar 401 sem token de autenticação', async () => {
    await request(app.getHttpServer()).get('/users/1').expect(401);
  });
});
```

Pontos importantes:
- Replique no teste as configurações globais reais do `main.ts` (`ValidationPipe`, filtros de exceção, versionamento de API) — testar sem elas dá falso positivo, porque em produção o comportamento é outro.
- Sempre incluir pelo menos um teste de autenticação/autorização por endpoint protegido (sem token → 401; token de outro usuário sem permissão → 403), não só o caminho feliz.
- Verificar explicitamente que campos sensíveis (senha, hash, tokens internos) não aparecem na resposta — isso também é item do checklist de segurança do code review.

## Banco de dados de teste: estratégias

| Estratégia | Quando usar | Trade-off |
|---|---|---|
| SQLite in-memory | Testes rápidos, projeto pequeno, sem uso de features específicas do banco de produção | Não pega bugs específicos do dialeto SQL de produção (ex: funções específicas do Postgres) |
| Testcontainers (Postgres/Mongo real em container) | Quando a query usa features específicas do banco, ou o projeto já é maduro o suficiente para justificar o tempo de setup | Mais lento, exige Docker disponível no CI |
| Transação com rollback por teste | Quando quer isolamento total sem custo de limpar tabelas manualmente | Requer que o código de teste controle a transação nível de teste, o que pode não bater com o padrão de conexão do ORM |
| Mock completo do repository | Só para teste **unitário**, nunca para integração/e2e | Não valida nada do banco real — não é o objetivo aqui |

Se o usuário não especificar, prefira a estratégia mais simples que já existe no projeto (verificar se já há setup de teste, `jest-e2e.json`, ou containers de teste configurados) antes de introduzir uma ferramenta nova.

## Erros comuns em testes de integração/e2e

- Testes que dependem da ordem de execução (`it` 2 assume dado criado no `it` 1) — cada teste deve poder rodar isolado ou usar `beforeEach` explícito.
- Esquecer de fechar conexões (`app.close()`, `module.close()`) — causa o processo do Jest não terminar ou vazar conexões entre suites.
- Rodar testes e2e contra o banco de desenvolvimento/produção por engano — sempre confirmar que a variável de ambiente de teste aponta para um banco isolado.
- Testar múltiplos endpoints não relacionados no mesmo `it` — dificulta saber o que quebrou quando falha.
