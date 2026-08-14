import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createChromeStorageMock} from '../../../__tests__/mocks/chromeMocks';
import {StorageFactory} from '../../../storage/StorageFactory';
import {StorageSettings} from '../../../storage/StorageSettings';
import type {ConfigProxy} from '../../../tools/ConfigSchema';
import {updateConfig} from '../configService';

function directProxy(id: string): ConfigProxy {
  return {
    id,
    enabled: true,
    title: id,
    color: '#123456',
    type: 'direct',
    whitePatterns: [],
    blackPatterns: [],
  };
}

describe('configService', () => {
  beforeEach(() => {
    const local = createChromeStorageMock();
    const sync = createChromeStorageMock();
    vi.stubGlobal('chrome', {storage: {local, sync}});
    (StorageFactory as unknown as {instance?: StorageFactory}).instance = undefined;
    (StorageSettings as unknown as {instance?: StorageSettings}).instance = undefined;
  });

  it('serializes concurrent updates so neither change is lost', async () => {
    await chrome.storage.sync.set({proxies: []});

    await Promise.all([
      updateConfig((config) => ({...config, proxies: [...config.proxies, directProxy('one')]})),
      updateConfig((config) => ({...config, proxies: [...config.proxies, directProxy('two')]})),
    ]);

    await expect(chrome.storage.sync.get('proxies')).resolves.toEqual({
      proxies: [directProxy('one'), directProxy('two')],
    });
  });
});
