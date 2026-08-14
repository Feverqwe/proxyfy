import type {ProxyMode, ProxyState} from '../../domain/proxy/proxyState';
import {getConfig} from '../../tools/index';
import {getPacScript} from '../pac/pacService';

export class ProxySelectionError extends Error {}

export async function setProxy(mode: ProxyMode, id?: string): Promise<ProxyState> {
  let value: chrome.types.ChromeSettingSetDetails<chrome.proxy.ProxyConfig>['value'];
  let selection: ProxyState;

  switch (mode) {
    case 'system': {
      value = {
        mode: 'system' as const,
      };
      selection = {mode};
      break;
    }
    case 'auto_detect': {
      value = {
        mode: 'auto_detect' as const,
      };
      selection = {mode};
      break;
    }
    case 'direct':
    case 'fixed_servers': {
      const config = await getConfig();
      let proxy = config.proxies.find((proxy) => proxy.id === id);
      if (!proxy && mode === 'direct') {
        proxy = config.proxies.find((proxy) => proxy.type === 'direct');
      }
      if (!proxy) {
        throw new ProxySelectionError(`Proxy is not found: ${id || mode}`);
      }

      if (proxy.type === 'direct') {
        value = {
          mode: 'direct' as const,
        };
        selection = {mode: 'direct', id: proxy.id};
      } else {
        value = {
          mode: 'fixed_servers' as const,
          rules: {
            singleProxy: {
              scheme: proxy.type,
              host: proxy.host,
              port: proxy.port,
            },
          },
        };
        selection = {mode: 'fixed_servers', id: proxy.id};
      }
      break;
    }
    case 'pac_script': {
      const config = await getConfig();
      value = {
        mode: 'pac_script' as const,
        pacScript: {
          data: await getPacScript(config.proxies),
          mandatory: true,
        },
      };
      selection = {mode};
      break;
    }
  }

  await chrome.proxy.settings.set({
    value,
    scope: 'regular',
  });
  return selection;
}
