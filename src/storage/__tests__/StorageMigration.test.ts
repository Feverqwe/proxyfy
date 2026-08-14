import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createChromeStorageMock} from '../../__tests__/mocks/chromeMocks';
import {StorageFactory} from '../StorageFactory';
import {StorageSettings, StorageType} from '../StorageSettings';

describe('storage migration', () => {
  beforeEach(() => {
    const local = createChromeStorageMock();
    const sync = createChromeStorageMock();
    vi.stubGlobal('chrome', {storage: {local, sync}});
    (StorageFactory as unknown as {instance?: StorageFactory}).instance = undefined;
    (StorageSettings as unknown as {instance?: StorageSettings}).instance = undefined;
  });

  it('copies and verifies config before activating the target storage', async () => {
    const proxies = [
      {
        id: 'office',
        enabled: true,
        title: 'Office',
        color: '#123456',
        type: 'http' as const,
        host: 'proxy.example.com',
        port: 8080,
        whitePatterns: [],
        blackPatterns: [],
      },
    ];
    await chrome.storage.sync.set({proxies});
    const factory = StorageFactory.getInstance();

    await factory.switchStorageType(StorageType.LOCAL);

    await expect(chrome.storage.local.get('proxies')).resolves.toEqual({proxies});
    expect(factory.getCurrentStorageType()).toBe(StorageType.LOCAL);
  });

  it('keeps the source active when writing the target fails', async () => {
    await chrome.storage.sync.set({proxies: []});
    vi.spyOn(chrome.storage.local, 'set').mockRejectedValueOnce(new Error('Quota exceeded'));
    const factory = StorageFactory.getInstance();

    await expect(factory.switchStorageType(StorageType.LOCAL)).rejects.toMatchObject({
      code: 'unavailable',
    });

    expect(factory.getCurrentStorageType()).toBe(StorageType.SYNC);
  });
});
