import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from 'src/configs/env.schema';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService<Env>) {
    const encryptionKey = this.configService.getOrThrow<string>('ENCRYPTION_KEY');
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  generateState(userId: string): string {
    const payload = JSON.stringify({
      userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutos
    });

    return this.encrypt(payload);
  }

  verifyState(state: string): { userId: string } {
    let payload: { userId: string; exp: number };

    try {
      payload = JSON.parse(this.decrypt(state));
    } catch {
      throw new Error('State inválido ou adulterado.');
    }

    if (Math.floor(Date.now() / 1000) > payload.exp) {
      throw new Error('State expirado. Reinicie o fluxo OAuth.');
    }

    return { userId: payload.userId };
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}
