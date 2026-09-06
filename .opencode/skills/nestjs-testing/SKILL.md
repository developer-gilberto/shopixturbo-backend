---
name: nestjs-testing
description: Cria testes unitários e de integração/e2e para projetos NestJS usando Jest e supertest — services, controllers, guards, pipes, interceptors, resolvers GraphQL, e endpoints HTTP completos. Use SEMPRE que o usuário pedir para "criar testes", "escrever testes", "testar esse service/controller", "cobertura de teste", "testes de integração", "testes e2e" em um projeto NestJS, ou quando adicionar/alterar um service, controller, guard ou provider e fizer sentido sugerir também os testes correspondentes. Cobre mock de dependências (TypeORM, Prisma, Mongoose, HttpService), TestingModule, banco de dados de teste, e boas práticas de estrutura AAA (Arrange-Act-Assert).
license: MIT
---

# Testes em NestJS (Unitários e Integração/E2E)

Skill para gerar testes que realmente verificam comportamento — não testes que só existem pra aumentar número de cobertura.

## Quando usar

Sempre que o usuário pedir testes para código NestJS, ou quando ele mostrar um service/controller/guard novo e o contexto sugerir que testes fazem sentido (ex: "implementei isso, pode revisar" em conjunto com a skill de code review — testes ausentes em lógica de negócio não trivial é, inclusive, um dos itens do checklist geral de code review).

## Decidir o tipo de teste primeiro

Antes de escrever qualquer teste, identifique o que está sendo testado:

| O que é | Tipo de teste | Ferramenta |
|---|---|---|
| Service com lógica de negócio, guard, pipe, interceptor, resolver isolado | **Unitário** | Jest + mocks (`TestingModule` com providers mockados) |
| Fluxo entre múltiplas camadas (controller → service → repository) sem subir o app HTTP completo | **Integração** | Jest + `TestingModule` real (sem mocks de camada interna), pode usar banco de teste real ou in-memory |
| Endpoint HTTP completo, do request até a resposta, validando middleware/guards/pipes reais | **E2E** | Jest + `supertest` + app NestJS completo (`app.init()`) |

Ver `references/testes-unitarios.md`, `references/testes-integracao-e2e.md` e `references/mocks-e-fixtures.md` conforme o tipo.

## Processo

1. **Leia o código a ser testado por completo** — entenda as dependências injetadas (constructor), os caminhos de sucesso, e principalmente os caminhos de erro/exceção (é aí que a maioria dos testes fracos falha em cobrir).

2. **Mapeie os casos antes de escrever código de teste**:
   - Caminho feliz (happy path)
   - Cada validação/exceção que o código lança (`NotFoundException`, `BadRequestException`, `ForbiddenException`, etc.)
   - Casos de borda: lista vazia, valor nulo/undefined, string vazia, valor no limite (0, negativo, muito grande)
   - Comportamento quando uma dependência externa falha (repository lança erro, chamada HTTP externa falha)

3. **Escreva os testes seguindo AAA** (Arrange-Act-Assert), um `it`/`test` por comportamento — não agrupe múltiplas asserções não relacionadas no mesmo teste.

4. **Nomeie os testes descrevendo o comportamento esperado**, não a implementação: `it('deve lançar NotFoundException quando o usuário não existe')`, não `it('testa findOne')`.

5. **Mock só o que precisa ser mockado.** Em teste unitário, mocke as dependências externas ao que está sendo testado (repository, HttpService, outros services). Em teste de integração, prefira usar a implementação real das camadas internas e mockar só a borda externa (banco de teste real ou in-memory, serviços de terceiros sempre mockados).

6. **Depois de escrever, revise os próprios testes**: cada `expect` está checando algo específico (valor, chamada de mock com argumentos certos), ou só "não lançou erro"? Teste fraco é pior que não ter teste — dá falsa sensação de segurança.

## O que NÃO fazer

- Não escreva teste que só verifica se a função foi chamada (`expect(service.method).toHaveBeenCalled()`) sem checar o resultado ou os argumentos — isso testa "existe uma chamada", não "o comportamento está correto".
- Não faça mock excessivo que acaba testando a implementação em vez do comportamento (ex: mockar métodos internos do próprio service sendo testado).
- Não deixe testes dependentes de ordem de execução ou de estado deixado por outro teste — cada teste deve poder rodar isolado (`beforeEach` limpando mocks e estado).
- Não escreva testes de integração/e2e sem limpar o estado do banco entre execuções (ver `references/testes-integracao-e2e.md`).

## Formato de saída

Ao entregar os testes:

1. Explique brevemente (2-3 linhas) a estratégia usada — unitário, integração ou e2e, e por quê.
2. Entregue o arquivo de teste completo, seguindo a convenção do projeto (`*.spec.ts` para unitário/integração, `*.e2e-spec.ts` para e2e).
3. Se identificar que o código testado tem um problema (ex: não trata um caso de erro, ou tem uma dependência difícil de mockar por causa de acoplamento forte), diga isso diretamente — não escreva um teste artificial só pra "fazer passar" um comportamento ruim.
