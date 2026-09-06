# Testes Unitários em NestJS

Testam uma unidade isolada (service, controller, guard, pipe, interceptor, resolver) mockando todas as dependências injetadas.

## Estrutura básica com TestingModule

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('deve retornar o usuário quando ele existe', async () => {
      const usuarioFake = { id: '1', nome: 'Ana' };
      repository.findById.mockResolvedValue(usuarioFake);

      const resultado = await service.findById('1');

      expect(resultado).toEqual(usuarioFake);
      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('deve lançar NotFoundException quando o usuário não existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

Pontos importantes desse padrão:
- `jest.Mocked<T>` dá tipagem correta aos métodos mockados — evita `any` disfarçado no teste.
- `afterEach(() => jest.clearAllMocks())` evita que uma chamada de mock de um teste vaze para o próximo.
- Testar tanto o valor de retorno quanto os argumentos com que o mock foi chamado.

## Testando Controllers

Controller geralmente só delega para o service — o teste unitário dele verifica que a delegação e o mapeamento de exceções HTTP estão corretos, não a lógica de negócio (essa já foi testada no service).

```typescript
describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { findById: jest.fn(), create: jest.fn() } },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('deve retornar o usuário do service', async () => {
    service.findById.mockResolvedValue({ id: '1', nome: 'Ana' });

    const resultado = await controller.findOne('1');

    expect(resultado).toEqual({ id: '1', nome: 'Ana' });
  });
});
```

## Testando Guards

Guards implementam `canActivate` e geralmente dependem de `ExecutionContext`. Monte um mock de contexto mínimo:

```typescript
function criarExecutionContextMock(request: Partial<Request>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
    }),
  } as ExecutionContext;
}

describe('AuthGuard', () => {
  it('deve permitir acesso quando o token é válido', () => {
    const guard = new AuthGuard(jwtServiceMock);
    const context = criarExecutionContextMock({ headers: { authorization: 'Bearer token-valido' } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('deve negar acesso quando não há token', () => {
    const guard = new AuthGuard(jwtServiceMock);
    const context = criarExecutionContextMock({ headers: {} });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
```

## Testando Pipes

Pipes são geralmente puros (input → output ou exceção), então costumam ser os testes mais simples — não precisam de `TestingModule`, dá pra instanciar direto:

```typescript
describe('ParseUUIDPipe customizado', () => {
  const pipe = new ParseUUIDPipe();

  it('deve retornar o valor quando é um UUID válido', () => {
    expect(pipe.transform('123e4567-e89b-12d3-a456-426614174000')).toBe(
      '123e4567-e89b-12d3-a456-426614174000',
    );
  });

  it('deve lançar BadRequestException para valor inválido', () => {
    expect(() => pipe.transform('não-é-uuid')).toThrow(BadRequestException);
  });
});
```

## Testando Interceptors

Interceptors envolvem o `CallHandler` — normalmente testados verificando a transformação aplicada ao `Observable` retornado:

```typescript
it('deve transformar a resposta adicionando timestamp', (done) => {
  const interceptor = new TimestampInterceptor();
  const contextMock = criarExecutionContextMock({});
  const callHandlerMock: CallHandler = {
    handle: () => of({ dado: 'valor' }),
  };

  interceptor.intercept(contextMock, callHandlerMock).subscribe((resultado) => {
    expect(resultado).toEqual({ dado: 'valor', timestamp: expect.any(Number) });
    done();
  });
});
```

## Casos de borda que costumam faltar

- Dependência retornando `null`/`undefined` quando o código espera um objeto.
- Dependência lançando exceção inesperada (não a de negócio, mas um erro genérico tipo falha de conexão) — o service trata ou deixa vazar sem contexto?
- Array vazio em vez de lista com itens, em métodos que fazem `find`, `map`, `reduce` sobre resultado de repository.
- Valores numéricos no limite: `0`, negativo, ou paginação com `page=0` ou `limit` muito alto.
