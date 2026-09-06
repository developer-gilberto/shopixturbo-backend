import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from 'src/database/redis.service';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redisClient: {
    pipeline: jest.Mock;
    pttl: jest.Mock;
    pexpire: jest.Mock;
    get: jest.Mock;
    set: jest.Mock;
  };
  let pipelineObj: { incr: jest.Mock; pexpire: jest.Mock; exec: jest.Mock };

  const buildPipeline = (count: number) => {
    pipelineObj = {
      incr: jest.fn(),
      pexpire: jest.fn(),
      exec: jest.fn().mockResolvedValue([[null, count]]),
    };
    redisClient.pipeline.mockReturnValue(pipelineObj);
  };

  beforeEach(async () => {
    redisClient = {
      pipeline: jest.fn(),
      pttl: jest.fn(),
      pexpire: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitService, { provide: RedisService, useValue: redisClient }],
    }).compile();

    service = module.get(RateLimitService);
  });

  it('retorna sem aguardar quando a contagem está dentro do limite', async () => {
    buildPipeline(1);
    redisClient.pttl.mockResolvedValue(0);

    await expect(service.limitOrWait('key', 5, 2000)).resolves.toBeUndefined();
    expect(pipelineObj.incr).toHaveBeenCalled();
    expect(pipelineObj.pexpire).toHaveBeenCalled();
  });

  it('lança erro quando o pipeline retorna null', async () => {
    redisClient.pipeline.mockReturnValue({
      incr: jest.fn(),
      pexpire: jest.fn(),
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.limitOrWait('key', 5, 2000)).rejects.toThrow('Redis pipeline retornou null');
  });

  it('falha com rate limit excedido quando ultrapassa as tentativas por janela com ttl zerado', async () => {
    buildPipeline(99);
    redisClient.pttl.mockResolvedValue(0);

    await expect(service.limitOrWait('key', 5, 2000)).rejects.toThrow('Rate limit excedido por key: key');
    expect(pipelineObj.exec).toHaveBeenCalledTimes(10);
  });

  it('aguarda o ttl antes de tentar novamente quando está acima do limite', async () => {
    jest.useFakeTimers();
    try {
      const exec = jest
        .fn()
        .mockResolvedValueOnce([[null, 99]])
        .mockResolvedValueOnce([[null, 1]]);
      redisClient.pipeline.mockReturnValue({ incr: jest.fn(), pexpire: jest.fn(), exec });
      redisClient.pttl.mockResolvedValue(1000);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const promise = service.limitOrWait('key', 5, 2000);
      await jest.runAllTimersAsync();

      await expect(promise).resolves.toBeUndefined();
      expect(exec).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
      jest.restoreAllMocks();
    }
  });
});
