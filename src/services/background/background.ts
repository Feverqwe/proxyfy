import {StorageType} from '../../storage/StorageSettings';
import {StorageFactory} from '../../storage/index';
import {asyncResponse} from '../../tools/index';
import {applyConfig} from '../proxy/proxyConfigService';
import {isBackgroundRequestMessage, parseBackgroundRequest} from '../runtime/runtimeContract';
import {syncUiState} from '../ui/uiStateService';

import {handleBackgroundRequest} from './backgroundRequestHandler';

export async function initBackgroundService() {
  chrome.runtime.onMessage.addListener(
    (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      if (!isBackgroundRequestMessage(message)) return;

      return asyncResponse(sendResponse, async () => {
        const request = parseBackgroundRequest(message);
        if (!request) throw new Error('Invalid background request');

        return handleBackgroundRequest(request);
      });
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
        try {
          await applyConfig();
        } catch (err) {
          console.error('Apply config after storage switch error: %O', err);
        }
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

  chrome.proxy.settings.onChange.addListener(async (details) => {
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
