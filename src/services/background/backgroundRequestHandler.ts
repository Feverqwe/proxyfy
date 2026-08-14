import {
  cloneProxy,
  moveProxy,
  removeProxy,
  replaceProxyPatterns,
  saveProxy,
  setProxyEnabled,
} from '../../domain/proxy/configMutations';
import {stripProxyCredentials} from '../../domain/proxy/proxyCredentials';
import {StorageFactory} from '../../storage/StorageFactory';
import {StorageSettings, StorageType} from '../../storage/StorageSettings';
import {readConfig, updateConfig, writeConfig} from '../config/configService';
import {applyProxy} from '../proxy/proxyConfigService';
import {getCurrentState} from '../proxy/proxyStateService';
import type {BackgroundRequest} from '../runtime/runtimeContract';
import {RuntimeAction} from '../runtime/runtimeContract';

let commandQueue: Promise<void> = Promise.resolve();

export function handleBackgroundRequest(request: BackgroundRequest): Promise<unknown> {
  const command = commandQueue.then(
    () => executeBackgroundRequest(request),
    () => executeBackgroundRequest(request),
  );
  commandQueue = command.then(
    () => undefined,
    () => undefined,
  );
  return command;
}

async function executeBackgroundRequest(request: BackgroundRequest): Promise<unknown> {
  switch (request.action) {
    case RuntimeAction.GetState:
      return getCurrentState();
    case RuntimeAction.SetProxy:
      return applyProxy(request.mode, request.id);
    case RuntimeAction.GetConfig:
      return readConfig();
    case RuntimeAction.GetExportConfig:
      return stripProxyCredentials(await readConfig());
    case RuntimeAction.ReplaceConfig:
      await writeConfig(request.config);
      return;
    case RuntimeAction.SaveProxy:
      await updateConfig((config) => saveProxy(config, request.proxy, request.isNew));
      return;
    case RuntimeAction.RemoveProxy:
      await updateConfig((config) => removeProxy(config, request.proxyId));
      return;
    case RuntimeAction.MoveProxy:
      await updateConfig((config) => moveProxy(config, request.proxyId, request.offset));
      return;
    case RuntimeAction.SetProxyEnabled:
      await updateConfig((config) => setProxyEnabled(config, request.proxyId, request.enabled));
      return;
    case RuntimeAction.CloneProxy:
      await updateConfig((config) => cloneProxy(config, request.proxyId, request.cloneId));
      return;
    case RuntimeAction.ReplaceProxyPatterns:
      await updateConfig((config) =>
        replaceProxyPatterns(config, request.proxyId, request.whitePatterns, request.blackPatterns),
      );
      return;
    case RuntimeAction.GetStorageSettings: {
      const storageFactory = StorageFactory.getInstance();
      await storageFactory.initialize();
      const storageSettings = StorageSettings.getInstance();
      return {
        storageType: storageFactory.getCurrentStorageType(),
        defaultIconColor: storageSettings.getDefaultIconColor(),
      };
    }
    case RuntimeAction.SwitchStorage: {
      const storageType = request.storageType === 'sync' ? StorageType.SYNC : StorageType.LOCAL;
      const storageFactory = StorageFactory.getInstance();
      await storageFactory.initialize();
      return storageFactory.switchStorageType(storageType);
    }
    case RuntimeAction.SetDefaultIconColor: {
      const storageSettings = StorageSettings.getInstance();
      await storageSettings.initialize();
      return storageSettings.setDefaultIconColor(request.color);
    }
  }
}
