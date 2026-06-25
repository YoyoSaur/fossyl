import { describe, it, expect } from 'vitest';
import {
  createPingSchema,
  updatePingSchema,
  listPingQuerySchema,
} from './ping.validators';

describe('Ping Validators', () => {
  describe('createPingSchema', () => {
    it('should accept valid message', () => {
      const result = createPingSchema.parse({ message: 'hello' });
      expect(result.message).toBe('hello');
    });

    it('should reject empty message', () => {
      expect(() => createPingSchema.parse({ message: '' })).toThrow();
    });

    it('should reject missing message', () => {
      expect(() => createPingSchema.parse({})).toThrow();
    });
  });

  describe('updatePingSchema', () => {
    it('should accept optional message', () => {
      const result = updatePingSchema.parse({ message: 'updated' });
      expect(result.message).toBe('updated');
    });

    it('should accept empty body', () => {
      const result = updatePingSchema.parse({});
      expect(result.message).toBeUndefined();
    });
  });

  describe('listPingQuerySchema', () => {
    it('should accept search query', () => {
      const result = listPingQuerySchema.parse({ search: 'test' });
      expect(result.search).toBe('test');
    });

    it('should accept empty query', () => {
      const result = listPingQuerySchema.parse({});
      expect(result.search).toBeUndefined();
    });
  });
});
