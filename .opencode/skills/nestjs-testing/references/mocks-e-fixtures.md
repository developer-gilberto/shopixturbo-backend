# Mocks e Fixtures

## Mockando providers no TestingModule

Três formas de sobrescrever um provider, do mais simples ao mais flexível:

```typescript
// useValue — objeto fixo com métodos jest.fn(). Mais comum.
{ provide: UsersRepository, useValue: { findById: jest.fn() } }

// useClass — troca a implementação inteira por uma classe fake.
{ provide: EmailService, useClass: EmailServiceFake }

// useFactory — quando o mock precisa de alguma configuração ou depende de outro provider.
{
  provide: ConfigService,
  useFactory: () => ({ get: jest.fn((key: string) => configFake[key]) }),
}
```

Alternativa mais enxuta quando o módulo já existe e você só quer trocar um provider: `overrideProvider` no builder do `TestingModule`.

```typescript
const module = await Test.createTestingModule({ imports: [UsersModule] })
  .overrideProvider(UsersRepository)
  .useValue({ findById: jest.fn() })
  .compile();
```

## Mockando o repository do TypeORM

```typescript
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function criarMockRepository<T = any>(): MockRepository<T> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };
}

// no módulo de teste:
{ provide: getRepositoryToken(User), useValue: criarMockRepository<User>() }
```

Atenção: `repository.create()` do TypeORM só monta a entidade em memória, não salva. Se o código faz `repository.create(dto)` seguido de `repository.save(entidade)`, o mock de `create` precisa retornar algo coerente para o `save` receber, senão o teste passa testando `undefined`.

## Mockando o Prisma

O `PrismaService` geralmente é injetado direto. Duas abordagens comuns:

```typescript
// Opção simples: mock manual do client
const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

{ provide: PrismaService, useValue: prismaMock }
```

Para projetos maiores, considerar `jest-mock-extended` (`mockDeep<PrismaClient>()`) para não precisar declarar manualmente cada model/método usado.

## Mockando chamadas HTTP externas (HttpService / axios)

```typescript
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';

const httpServiceMock = {
  get: jest.fn(),
};

function criarAxiosResponseFake<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as any };
}

// no teste:
httpServiceMock.get.mockReturnValue(of(criarAxiosResponseFake({ resultado: 'ok' })));
```

Nunca deixar um teste (unitário ou de integração) fazer uma chamada HTTP real para um serviço de terceiros — além de lento e não-determinístico (rate limit, indisponibilidade), pode ter efeito colateral real (enviar email de verdade, cobrar em gateway de pagamento).

## Fixtures e factories

Para dados de teste reutilizados em várias suítes, preferir uma função factory a objetos fixos copiados e colados — facilita manter consistência e sobrescrever só o campo relevante ao teste:

```typescript
function criarUsuarioFake(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    nome: 'Usuário Teste',
    email: 'teste@exemplo.com',
    criadoEm: new Date('2024-01-01'),
    ...overrides,
  };
}

// uso:
const usuarioSemEmail = criarUsuarioFake({ email: undefined });
```

Isso evita o problema comum de um objeto de fixture gigante e compartilhado onde ninguém sabe mais quais campos importam para qual teste.

## Quando usar `jest.spyOn` em vez de mock completo

Útil quando você quer testar o comportamento real de um método mas verificar/alterar uma chamada específica, sem recriar o objeto inteiro:

```typescript
const spy = jest.spyOn(service, 'enviarEmailDeConfirmacao').mockResolvedValue(undefined);

await service.criarConta(dto);

expect(spy).toHaveBeenCalledWith(dto.email);
```

Cuidado: `spyOn` em método do próprio objeto sendo testado (em vez de uma dependência) geralmente é sinal de teste testando implementação em vez de comportamento — questionar se não seria melhor extrair esse método para outra classe/service e mockar a dependência de verdade.
