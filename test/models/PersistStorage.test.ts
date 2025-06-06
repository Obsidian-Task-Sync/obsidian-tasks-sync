import { describe, it, expect, beforeEach } from 'vitest';
import { PersistStorage } from '../../src/models/PersistStorage';

describe('PersistStorage', () => {
  let store: Map<string, any>;
  let app: any;
  let storage: PersistStorage<number>;
  const key = 'test-key';
  const parser = (value: string) => parseInt(value, 10);

  beforeEach(() => {
    store = new Map<string, any>();
    app = {
      loadLocalStorage: (k: string) => (store.has(k) ? store.get(k) : null),
      saveLocalStorage: (k: string, v: any) => {
        store.set(k, v);
      },
    };
    storage = new PersistStorage<number>(app, key, parser);
  });

  it('should return null if no value in storage', async () => {
    const result = await storage.get();
    expect(result).toBeNull();
  });

  it('should parse and return value if present', async () => {
    store.set(key, '42');
    const result = await storage.get();
    expect(result).toBe(42);
  });

  it('should save value to storage', async () => {
    await storage.set(123);
    expect(store.get(key)).toBe(123);
  });

  it('should overwrite value in storage', async () => {
    await storage.set(100);
    await storage.set(200);
    expect(store.get(key)).toBe(200);
  });

  it('should work with different keys', async () => {
    const storage2 = new PersistStorage<number>(app, 'another-key', parser);
    await storage.set(1);
    await storage2.set(2);
    expect(store.get(key)).toBe(1);
    expect(store.get('another-key')).toBe(2);
  });
});
