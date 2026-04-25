import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/database/redis.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly redisClient: RedisService) {}

  async limitOrWait(key: string, limit: number, windowMs: number) {
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts++ < maxAttempts) {
      const now = Date.now();
      const windowKey = `${key}:${Math.floor(now / windowMs)}`;

      const pipeline = this.redisClient.pipeline();
      pipeline.incr(windowKey);
      pipeline.pexpire(windowKey, windowMs);

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline retornou null');
      }

      const count = results[0][1] as number;

      if (count <= limit) return;

      const ttl = await this.redisClient.pttl(windowKey);

      if (ttl > 0) {
        const jitter = Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, ttl + jitter));
      }
    }

    throw new Error(`Rate limit excedido por key: ${key}`);
  }
}
