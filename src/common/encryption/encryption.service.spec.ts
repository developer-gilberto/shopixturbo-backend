import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  const VALID_KEY = 'a'.repeat(64);

  const createService = (key: string = VALID_KEY) =>
    new EncryptionService({ getOrThrow: jest.fn(() => key) } as unknown as ConfigService);

  describe('constructor', () => {
    it('lança erro quando a ENCRYPTION_KEY não tem 64 caracteres', () => {
      expect(() => createService('short')).toThrow('ENCRYPTION_KEY must be a 64-character hex string');
    });
  });

  describe('encrypt / decrypt', () => {
    it('descriptografa o texto criptografado retornando o valor original', () => {
      const service = createService();
      const plaintext = 'meu-token-secreto';

      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toContain(plaintext);
    });

    it('gera ciphertext diferente para o mesmo texto (iv aleatório)', () => {
      const service = createService();

      const a = service.encrypt('token');
      const b = service.encrypt('token');

      expect(a).not.toBe(b);
    });
  });

  describe('generateState / verifyState', () => {
    it('retorna o userId de um state válido gerado pelo serviço', () => {
      const service = createService();

      const state = service.generateState('user-1');
      const payload = service.verifyState(state);

      expect(payload.userId).toBe('user-1');
    });
  });
});
