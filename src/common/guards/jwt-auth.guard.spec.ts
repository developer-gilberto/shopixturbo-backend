import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verify: jest.Mock };

  const createContext = (
    authorization?: string,
  ): {
    context: ExecutionContext;
    request: { headers: Record<string, string | undefined>; user?: unknown };
  } => {
    const request: { headers: Record<string, string | undefined>; user?: unknown } = {
      headers: authorization ? { authorization } : {},
    };

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    return { context, request };
  };

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    guard = new JwtAuthGuard(jwtService as unknown as JwtService);
  });

  it('lança UnauthorizedException quando não há token no header', () => {
    expect(() => guard.canActivate(createContext().context)).toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o scheme do header não é Bearer', () => {
    expect(() => guard.canActivate(createContext('Basic abc123').context)).toThrow(UnauthorizedException);
  });

  it('permite acesso quando o token é válido e injeta o usuário no request', () => {
    const payload = { sub: 'user-1', email: 'a@b.com' };
    jwtService.verify.mockReturnValue(payload);

    const { context, request } = createContext('Bearer token-valido');

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual(payload);
  });

  it('lança UnauthorizedException quando o token é inválido', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    expect(() => guard.canActivate(createContext('Bearer token-invalido').context)).toThrow(UnauthorizedException);
  });
});
