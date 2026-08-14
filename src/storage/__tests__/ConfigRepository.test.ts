import {beforeEach, describe, expect, it, vi} from 'vitest';

import {ConfigRepository, ConfigRepositoryError} from '../ConfigRepository';
import type {StorageService} from '../StorageService';

describe('ConfigRepository', () => {
  let storage: StorageService;

  beforeEach(() => {
    storage = {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
      clear: vi.fn(),
    };
  });

  it('returns an empty configuration only when the key is absent', async () => {
    const repository = new ConfigRepository(storage);

    await expect(repository.read()).resolves.toEqual({proxies: []});
    expect(storage.get).toHaveBeenCalledWith('proxies');
  });

  it('distinguishes corrupt data from an empty configuration', async () => {
    vi.mocked(storage.get).mockResolvedValue({proxies: 'invalid'});
    const repository = new ConfigRepository(storage);

    await expect(repository.read()).rejects.toMatchObject<Partial<ConfigRepositoryError>>({
      code: 'corrupt',
    });
  });

  it('distinguishes an unavailable storage backend', async () => {
    vi.mocked(storage.get).mockRejectedValue(new Error('Storage is unavailable'));
    const repository = new ConfigRepository(storage);

    await expect(repository.read()).rejects.toMatchObject<Partial<ConfigRepositoryError>>({
      code: 'unavailable',
    });
  });

  it('writes only the configuration key', async () => {
    const repository = new ConfigRepository(storage);

    await repository.write({proxies: []});

    expect(storage.set).toHaveBeenCalledWith({proxies: []});
  });
});
