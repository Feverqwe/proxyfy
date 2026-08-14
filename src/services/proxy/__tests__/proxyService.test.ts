import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createChromeStorageMock} from '../../../__tests__/mocks/chromeMocks';
import {StorageFactory} from '../../../storage/StorageFactory';
import {StorageSettings} from '../../../storage/StorageSettings';
import {ProxySelectionError, setProxy} from '../proxyService';

describe('setProxy', () => {
  beforeEach(async () => {
    const local = createChromeStorageMock();
    const sync = createChromeStorageMock();
    vi.stubGlobal('chrome', {
      storage: {local, sync},
      proxy: {
        settings: {
          set: vi.fn().mockResolvedValue(undefined),
          clear: vi.fn().mockResolvedValue(undefined),
        },
      },
    });
    (StorageFactory as unknown as {instance?: StorageFactory}).instance = undefined;
    (StorageSettings as unknown as {instance?: StorageSettings}).instance = undefined;
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
          whitePatterns: [],
          blackPatterns: [],
        },
      ],
    });
  });

  it('does not encode the selected proxy id in bypass rules', async () => {
    await expect(setProxy('fixed_servers', 'office')).resolves.toEqual({
      mode: 'fixed_servers',
      id: 'office',
    });

    expect(chrome.proxy.settings.set).toHaveBeenCalledWith({
      scope: 'regular',
      value: {
        mode: 'fixed_servers',
        rules: {
          singleProxy: {scheme: 'http', host: 'proxy.example.com', port: 8080},
        },
      },
    });
  });

  it('rejects a missing proxy without clearing current Chrome settings', async () => {
    await expect(setProxy('fixed_servers', 'missing')).rejects.toBeInstanceOf(ProxySelectionError);

    expect(chrome.proxy.settings.set).not.toHaveBeenCalled();
    expect(chrome.proxy.settings.clear).not.toHaveBeenCalled();
  });

  it('can switch to system mode even if stored config is corrupt', async () => {
    await chrome.storage.sync.set({proxies: 'invalid'});

    await expect(setProxy('system')).resolves.toEqual({mode: 'system'});
    expect(chrome.proxy.settings.set).toHaveBeenCalledWith({
      scope: 'regular',
      value: {mode: 'system'},
    });
  });
});
