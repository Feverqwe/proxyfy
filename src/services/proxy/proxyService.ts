import {LocalStorageService} from '../../storage/index';
import {GenericProxy, getConfig} from '../../tools/index';
import {getPacScript} from '../pac/pacService';

export async function setProxy(mode: string, id?: string): Promise<void> {
  const config = await getConfig();
  let value = null;

  switch (mode) {
    case 'system': {
      value = {
        mode: 'system' as const,
      };
      break;
    }
    case 'auto_detect': {
      value = {
        mode: 'auto_detect' as const,
      };
      break;
    }
    case 'direct':
    case 'fixed_servers': {
      let proxy = config.proxies.find((proxy) => proxy.id === id);
      if (!proxy && mode === 'direct') {
        proxy = config.proxies.find((proxy) => proxy.type === 'direct');
      }
      if (proxy) {
        if (proxy.type === 'direct') {
          const localService = new LocalStorageService();
          await localService.set({lastDirectId: proxy.id});
          value = {
            mode: 'direct' as const,
          };
        } else {
          // Use type assertion since we know proxy is GenericProxy at this point
          const genericProxy = proxy as GenericProxy;
          value = {
            mode: 'fixed_servers' as const,
            rules: {
              singleProxy: {
                scheme: genericProxy.type,
                host: genericProxy.host,
                port: genericProxy.port,
              },
              bypassList: [`${encodeURIComponent(genericProxy.id)}.proxyfy.localhost`],
            },
          };
        }
      }
      break;
    }
    case 'pac_script': {
      value = {
        mode: 'pac_script' as const,
        pacScript: {
          data: await getPacScript(config.proxies),
          mandatory: true,
        },
      };
      break;
    }
  }

  if (value) {
    await chrome.proxy.settings.set({
      value,
      scope: 'regular',
    });
  } else {
    await chrome.proxy.settings.clear({
      scope: 'regular',
    });
  }
}
