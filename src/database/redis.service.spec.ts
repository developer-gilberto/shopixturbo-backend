import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

const redisInstances: Array<Record<string, jest.Mock>> = [];

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const instance = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      pipeline: jest.fn(),
      pttl: jest.fn(),
      pexpire: jest.fn(),
    };
    redisInstances.push(instance);
    return instance;
  });
});

describe('RedisService', () => {
  let service: RedisService;
  let redisMock: Record<string, jest.Mock>;

  beforeEach(() => {
    redisInstances.length = 0;
    service = new RedisService({
      getOrThrow: jest.fn((key: string) => {
        if (key === 'REDIS_HOST') return 'localhost';
        return 6379;
      }),
    } as unknown as ConfigService);
    redisMock = redisInstances[0];
  });

  it('mantém valor nulo quando a chave não existe', async () => {
    redisMock.get.mockResolvedValue(null);

    await expect(service.get('chave')).resolves.toBeNull();
    expect(redisMock.get).toHaveBeenCalledWith('chave');
  });

  it('desserializa JSON armazenado na chave', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ a: 1 }));

    await expect(service.get('chave')).resolves.toEqual({ a: 1 });
  });

  it('serializa valor ao gravar com TTL em segundos', async () => {
    redisMock.set.mockResolvedValue('OK');

    await service.set('chave', { a: 1 }, 60);

    expect(redisMock.set).toHaveBeenCalledWith('chave', JSON.stringify({ a: 1 }), 'EX', 60);
  });

  it('grava sem TTL quando nenhum é informado', async () => {
    redisMock.set.mockResolvedValue('OK');

    await service.set('chave', 'valor');

    expect(redisMock.set).toHaveBeenCalledWith('chave', JSON.stringify('valor'));
  });

  it('remove a chave', async () => {
    redisMock.del.mockResolvedValue(1);

    await service.delete('chave');

    expect(redisMock.del).toHaveBeenCalledWith('chave');
  });

  it('delega pipeline, pttl e pexpire ao cliente', async () => {
    const pipeline = { exec: jest.fn() };
    redisMock.pipeline.mockReturnValue(pipeline);
    redisMock.pttl.mockResolvedValue(123);

    expect(service.pipeline()).toBe(pipeline);
    await expect(service.pttl('chave')).resolves.toBe(123);

    await service.pexpire('chave', 500);
    expect(redisMock.pexpire).toHaveBeenCalledWith('chave', 500);
  });
});
