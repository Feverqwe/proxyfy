import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  applyConfig: vi.fn().mockResolvedValue(undefined),
  applyProxy: vi.fn().mockResolvedValue(undefined),
  getCurrentState: vi.fn().mockResolvedValue(null),
  initializeStorage: vi.fn().mockResolvedValue(undefined),
  syncUiState: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../storage/index', () => ({
  StorageFactory: {
    getInstance: () => ({
      initialize: mocks.initializeStorage,
      getCurrentStorageType: () => 'local',
    }),
  },
}));

vi.mock('../../proxy/proxyConfigService', () => ({
  applyConfig: mocks.applyConfig,
  applyProxy: mocks.applyProxy,
}));

vi.mock('../../proxy/proxyStateService', () => ({
  getCurrentState: mocks.getCurrentState,
}));

vi.mock('../../ui/uiStateService', () => ({
  syncUiState: mocks.syncUiState,
}));

import {initBackgroundService} from '../background';

describe('initBackgroundService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reapplies the proxy configuration when the selected storage changes', async () => {
    await initBackgroundService();
    const listener = vi.mocked(chrome.storage.onChanged.addListener).mock.calls[0][0];

    await listener(
      {storageType: {oldValue: 'sync', newValue: 'local'}},
      'local' as chrome.storage.AreaName,
    );

    expect(mocks.initializeStorage).toHaveBeenCalled();
    expect(mocks.applyConfig).toHaveBeenCalledOnce();
  });
});
