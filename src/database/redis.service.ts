import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Env } from 'src/configs/env.schema';

@Injectable()
export class RedisService {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService<Env>) {
    this.redisClient = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  pipeline() {
    return this.redisClient.pipeline();
  }

  async pttl(key: string): Promise<number> {
    return this.redisClient.pttl(key);
  }

  async pexpire(key: string, ms: number): Promise<void> {
    await this.redisClient.pexpire(key, ms);
  }
}
