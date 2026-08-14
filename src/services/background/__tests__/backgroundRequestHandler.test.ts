import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createChromeStorageMock} from '../../../__tests__/mocks/chromeMocks';
import {StorageFactory} from '../../../storage/StorageFactory';
import {StorageSettings} from '../../../storage/StorageSettings';
import type {ConfigProxy} from '../../../tools/ConfigSchema';
import {RuntimeAction} from '../../runtime/runtimeContract';
import {handleBackgroundRequest} from '../backgroundRequestHandler';

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

describe('background request handler', () => {
  beforeEach(async () => {
    const local = createChromeStorageMock();
    const sync = createChromeStorageMock();
    vi.stubGlobal('chrome', {storage: {local, sync}});
    (StorageFactory as unknown as {instance?: StorageFactory}).instance = undefined;
    (StorageSettings as unknown as {instance?: StorageSettings}).instance = undefined;
    await chrome.storage.sync.set({proxies: []});
  });

  it('serializes proxy commands from concurrent UI contexts', async () => {
    await Promise.all([
      handleBackgroundRequest({
        action: RuntimeAction.SaveProxy,
        proxy: directProxy('one'),
        isNew: true,
      }),
      handleBackgroundRequest({
        action: RuntimeAction.SaveProxy,
        proxy: directProxy('two'),
        isNew: true,
      }),
    ]);

    await expect(chrome.storage.sync.get('proxies')).resolves.toEqual({
      proxies: [directProxy('one'), directProxy('two')],
    });
  });

  it('orders config writes before a requested storage migration', async () => {
    await Promise.all([
      handleBackgroundRequest({
        action: RuntimeAction.SaveProxy,
        proxy: directProxy('before-migration'),
        isNew: true,
      }),
      handleBackgroundRequest({
        action: RuntimeAction.SwitchStorage,
        storageType: 'local',
      }),
    ]);

    await expect(chrome.storage.local.get('proxies')).resolves.toEqual({
      proxies: [directProxy('before-migration')],
    });
  });

  it('exports public config without locally migrated credentials', async () => {
    await chrome.storage.sync.set({
      proxies: [
        {
          id: 'office',
          enabled: true,
          title: 'Office',
          color: '#123456',
          type: 'http',
          host: 'proxy.example.com',
          port: 8080,
          username: 'alice',
          password: 'secret',
          whitePatterns: [],
          blackPatterns: [],
        },
      ],
    });

    const exported = await handleBackgroundRequest({action: RuntimeAction.GetExportConfig});

    expect(JSON.stringify(exported)).not.toContain('alice');
    expect(JSON.stringify(exported)).not.toContain('secret');
    await expect(chrome.storage.local.get('proxyCredentials')).resolves.toEqual({
      proxyCredentials: [{proxyId: 'office', username: 'alice', password: 'secret'}],
    });
  });
});
