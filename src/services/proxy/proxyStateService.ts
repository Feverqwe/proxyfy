import {chromeProxySettingsGet} from '../../tools/index';
import {LocalStorageService} from '../../storage/index';

export async function getCurrentState(): Promise<{mode: string; id?: string} | null> {
  const proxySettings = await chromeProxySettingsGet({
    incognito: false,
  });
  const {mode, rules} = proxySettings.value;
  if (proxySettings.levelOfControl !== 'controlled_by_this_extension') {
    return null;
  }

  const result: {mode: string; id?: string} = {mode};
  if (mode === 'direct') {
    const localService = new LocalStorageService();
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
    });
  }
  return result;
}
