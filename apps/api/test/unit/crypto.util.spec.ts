import { encrypt, decrypt, generateOtpCode, generateSecureToken } from '../../src/common/utils';

describe('crypto.util', () => {
  const secret = 'test-secret-key-32-chars-long!!';

  describe('encrypt / decrypt', () => {
    it('should encrypt and decrypt a string', () => {
      const plaintext = 'Hello, World!';
      const ciphertext = encrypt(plaintext, secret);

      expect(ciphertext).not.toBe(plaintext);
      expect(ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/); // base64

      const decrypted = decrypt(ciphertext, secret);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext', () => {
      const plaintext = 'Same text';
      const c1 = encrypt(plaintext, secret);
      const c2 = encrypt(plaintext, secret);

      // Due to random salt + IV, these should differ
      expect(c1).not.toBe(c2);

      // But both should decrypt to the same value
      expect(decrypt(c1, secret)).toBe(plaintext);
      expect(decrypt(c2, secret)).toBe(plaintext);
    });

    it('should fail to decrypt with wrong secret', () => {
      const ciphertext = encrypt('secret data', secret);

      expect(() => decrypt(ciphertext, 'wrong-secret-key-32-chars-long!')).toThrow();
    });

    it('should handle empty string', () => {
      const ciphertext = encrypt('', secret);
      expect(decrypt(ciphertext, secret)).toBe('');
    });

    it('should handle unicode text', () => {
      const text = 'नमस्ते दुनिया 🙏';
      const ciphertext = encrypt(text, secret);
      expect(decrypt(ciphertext, secret)).toBe(text);
    });

    it('should handle long text', () => {
      const text = 'A'.repeat(10000);
      const ciphertext = encrypt(text, secret);
      expect(decrypt(ciphertext, secret)).toBe(text);
    });
  });

  describe('generateOtpCode', () => {
    it('should generate a 6-digit code by default', () => {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate code of specified length', () => {
      const code = generateOtpCode(8);
      expect(code).toMatch(/^\d{8}$/);
    });

    it('should generate different codes on subsequent calls', () => {
      const codes = new Set(Array.from({ length: 100 }, () => generateOtpCode()));
      // With 100 calls generating 6-digit codes, we expect many unique values
      expect(codes.size).toBeGreaterThan(50);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a base64url token', () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken()));
      expect(tokens.size).toBe(100);
    });
  });
});
