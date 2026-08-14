import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createChromeStorageMock} from '../../../__tests__/mocks/chromeMocks';
import {getCurrentState} from '../proxyStateService';

describe('getCurrentState', () => {
  beforeEach(() => {
    const local = createChromeStorageMock();
    vi.stubGlobal('chrome', {
      storage: {local},
      proxy: {
        settings: {
          get: vi.fn(),
        },
      },
    });
  });

  it('uses the explicit active selection for fixed proxy settings', async () => {
    await chrome.storage.local.set({
      activeProxySelection: {mode: 'fixed_servers', id: 'office'},
    });
    vi.mocked(chrome.proxy.settings.get).mockResolvedValue({
      levelOfControl: 'controlled_by_this_extension',
      value: {mode: 'fixed_servers', rules: {singleProxy: {host: 'proxy.example.com'}}},
    });

    await expect(getCurrentState()).resolves.toEqual({mode: 'fixed_servers', id: 'office'});
  });

  it('migrates a legacy proxy id from the old bypass sentinel', async () => {
    vi.mocked(chrome.proxy.settings.get).mockResolvedValue({
      levelOfControl: 'controlled_by_this_extension',
      value: {
        mode: 'fixed_servers',
        rules: {bypassList: ['office.proxyfy.localhost']},
      },
    });

    await expect(getCurrentState()).resolves.toEqual({mode: 'fixed_servers', id: 'office'});
    await expect(chrome.storage.local.get('activeProxySelection')).resolves.toEqual({
      activeProxySelection: {mode: 'fixed_servers', id: 'office'},
    });
  });

  it('ignores a stale selection when another extension controls settings', async () => {
    await chrome.storage.local.set({activeProxySelection: {mode: 'system'}});
    vi.mocked(chrome.proxy.settings.get).mockResolvedValue({
      levelOfControl: 'controlled_by_other_extensions',
      value: {mode: 'system'},
    });

    await expect(getCurrentState()).resolves.toBeNull();
  });
});
