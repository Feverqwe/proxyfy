import type {ProxyState} from '../../domain/proxy/proxyState';
import {isProxyMode} from '../../domain/proxy/proxyState';
import {LocalStorageService, ProxySelectionRepository} from '../../storage/index';
import {chromeProxySettingsGet} from '../../tools/index';

export async function getCurrentState(): Promise<ProxyState | null> {
  const proxySettings = await chromeProxySettingsGet({
    incognito: false,
  });
  const {mode, rules} = proxySettings.value;
  if (proxySettings.levelOfControl !== 'controlled_by_this_extension') {
    return null;
  }
  if (!isProxyMode(mode)) return null;

  const localService = new LocalStorageService();
  const selectionRepository = new ProxySelectionRepository(localService);
  const storedSelection = await selectionRepository.read();
  if (storedSelection?.mode === mode) {
    return storedSelection;
  }

  const result: ProxyState = {mode};
  if (mode === 'direct') {
    const {lastDirectId} = await localService.get('lastDirectId');
    if (typeof lastDirectId === 'string') {
      result.id = lastDirectId;
    }
  } else if (mode === 'fixed_servers' && rules && rules.bypassList) {
    rules.bypassList.some((pattern: string) => {
      const m = /^(.+)\.proxyfy\.localhost/.exec(pattern);
      if (m) {
        result.id = decodeURIComponent(m[1]);
        return true;
      }
      return false;
    });
  }
  if (mode !== 'fixed_servers' || result.id) {
    await selectionRepository.write(result);
  }
  return result;
}
