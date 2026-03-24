import {syncUiState} from '../ui/uiStateService';
import {getCurrentState} from '../proxy/proxyStateService';
import {applyConfig, applyProxy} from '../proxy/proxyConfigService';
import {StorageFactory} from '../../storage/index';
import {StorageType} from '../../storage/StorageSettings';
import {asyncResponse} from '../../tools/index';

export async function initBackgroundService() {
  chrome.runtime.onMessage.addListener(
    (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void,
    ) => {
      switch (message.action) {
        case 'set': {
          return asyncResponse(sendResponse, async () => {
            const {mode, id} = message;
            await applyProxy(mode, id);
          });
        }
        case 'get': {
          return asyncResponse(sendResponse, async () => getCurrentState());
        }
      }
    },
  );

  chrome.storage.onChanged.addListener(
    async (
      changes: {[key: string]: chrome.storage.StorageChange},
      areaName: chrome.storage.AreaName,
    ) => {
      const storageFactory = StorageFactory.getInstance();
      await storageFactory.initialize();

      if (areaName === 'local' && changes.storageType) {
        return;
      }

      const currentStorageType = storageFactory.getCurrentStorageType();
      const activeAreaName = currentStorageType === StorageType.SYNC ? 'sync' : 'local';

      if (areaName === activeAreaName && changes.proxies) {
        applyConfig().catch((err) => {
          console.error('applyConfig error: %O', err);
        });
      }

      if (areaName === 'local' && changes.defaultIconColor) {
        syncUiState().catch((err) => {
          console.error('syncUiState error: %O', err);
        });
      }
    },
  );

  chrome.proxy.onProxyError.addListener(
    ({details, error, fatal}: {details: string; error: string; fatal: boolean}) => {
      console.error('[%s] Proxy error: %s %o', fatal ? 'fatal' : 'warn', details, error);
    },
  );

  chrome.proxy.settings.onChange.addListener(async (details: any) => {
    if (details.levelOfControl === 'controlled_by_this_extension') return;
    try {
      await syncUiState();
    } catch (err) {
      console.error('Sync state error: %O', err);
    }
  });

  chrome.runtime.onStartup.addListener(() => {
    // pass
  });

  chrome.runtime.onInstalled.addListener(() => {
    // pass
  });

  try {
    await syncUiState();
  } catch (err) {
    console.error('Sync state on run error: %O', err);
  }
}
