import getExtensionIcon from './tools/getExtensionIcon';
import {
  Config,
  DirectProxyType,
  GenericProxy,
  GenericProxyType,
  ProxyPattern,
} from './tools/ConfigStruct';
import getConfig from './tools/getConfig';
import AuthListener from './tools/authListener';
import {StorageFactory} from './storage/StorageFactory';
import {StorageSettings, StorageType} from './storage/StorageSettings';
import {asyncResponse, chromeProxySettingsGet} from './tools/chromeApi';
import {AUTH_SUPPORTED} from './constants';
import {LocalStorageService} from './storage/LocalStorageService';

export type PacScriptPattern = Pick<ProxyPattern, 'type' | 'pattern'>; //  | 'protocol'

export type PacScript = {
  rules: (
    | {
        type: GenericProxyType;
        host: string;
        port: number;
        whitePatterns: PacScriptPattern[];
        blackPatterns: PacScriptPattern[];
      }
    | {
        type: DirectProxyType;
        whitePatterns: PacScriptPattern[];
        blackPatterns: PacScriptPattern[];
      }
  )[];
};

let authListener: AuthListener | null = null;

async function init() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
  });

  chrome.storage.onChanged.addListener(async (changes, areaName) => {
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
  });

  chrome.proxy.onProxyError.addListener(({details, error, fatal}) => {
    console.error('[%s] Proxy error: %s %o', fatal ? 'fatal' : 'warn', details, error);
  });

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

async function syncUiState() {
  const state = await getCurrentState();
  const config = await getConfig();
  let badgeColor = [0, 0, 0, 0];
  let badgeText = '';
  let iconColor;
  let newAuthListener: AuthListener | null = null;

  const storageSettings = StorageSettings.getInstance();
  await storageSettings.initialize();
  const defaultIconColor = storageSettings.getDefaultIconColor();

  if (state) {
    switch (state.mode) {
      case 'direct':
      case 'fixed_servers': {
        const {id} = state;
        let proxy = config.proxies.find((p) => p.id === id);
        if (!proxy && state.mode === 'direct') {
          proxy = config.proxies.find((p) => p.type === 'direct');
        }
        if (proxy) {
          iconColor = proxy.color;
          if (proxy.badgeText) {
            badgeText = proxy.badgeText;
          }
          if (proxy.badgeColor) {
            const m = /rgba\((\d+),(\d+),(\d+),(\d+)\)/.exec(proxy.badgeColor);
            if (m) {
              const [, rS, gS, bS, aS] = m;
              const [r, g, b, aF] = [rS, gS, bS, aS].map(parseFloat);
              const a = Math.round(aF * 255);
              badgeColor = [r, g, b, a].map((v) => {
                if (!Number.isFinite(v) || v < 0 || v > 255) {
                  v = 0;
                }
                return v;
              });
            }
          }
          if (AUTH_SUPPORTED) {
            newAuthListener = new AuthListener([proxy]);
          }
        }
        break;
      }
      case 'pac_script': {
        iconColor = defaultIconColor;
        if (AUTH_SUPPORTED) {
          newAuthListener = new AuthListener(config.proxies);
        }
        break;
      }
    }
  }

  if (authListener) {
    authListener.destroy();
    authListener = null;
  }
  if (newAuthListener && newAuthListener.isRequired) {
    authListener = newAuthListener;
    authListener.enable();
  }

  try {
    await Promise.all([
      chrome.action.setBadgeText({
        text: badgeText,
      }),
      chrome.action.setBadgeBackgroundColor({
        color: badgeColor as [number, number, number, number],
      }),
      chrome.action.setIcon({
        imageData: {
          16: getExtensionIcon(iconColor, 16),
          24: getExtensionIcon(iconColor, 24),
          32: getExtensionIcon(iconColor, 32),
        },
      }),
    ]);
  } catch (err) {
    console.error('Change badge error: %O', err);
  }

  try {
    await chrome.runtime.sendMessage({action: 'stateChanges'});
  } catch (_err) {
    // pass
  }
}

async function applyProxy(mode: string, id?: string) {
  // console.log('applyProxy', state);
  await setProxy(mode, id);

  await syncUiState();
}

async function applyConfig() {
  const state = await getCurrentState();
  // console.log('applyConfig', state);
  if (!state) return;

  await setProxy(state.mode, state.id);

  try {
    await chrome.runtime.sendMessage({action: 'proxiesChanges'});
  } catch (_err) {
    // pass
  }

  await syncUiState();
}

async function setProxy(mode: string, id?: string) {
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

async function getCurrentState() {
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

async function getPacScript(proxies: Config['proxies']) {
  const rules: PacScript['rules'] = [];
  proxies.forEach((proxy) => {
    if (!proxy.enabled) return;

    switch (proxy.type) {
      case DirectProxyType.Direct: {
        return rules.push({
          type: proxy.type,
          whitePatterns: getPatterns(proxy.whitePatterns),
          blackPatterns: getPatterns(proxy.blackPatterns),
        });
      }
      default: {
        return rules.push({
          type: proxy.type,
          host: proxy.host,
          port: proxy.port,
          whitePatterns: getPatterns(proxy.whitePatterns),
          blackPatterns: getPatterns(proxy.blackPatterns),
        });
      }
    }
  });

  const config: PacScript = {rules};

  const pacScript = await fetch('./pacScript.js')
    .then((r) => r.text())
    .then((t) => t.replace(/[^\x00-\x7F]/g, ''));

  return `var FindProxyForURL=null;\nvar Config=${JSON.stringify(config)};\n${pacScript};`;
}

function getPatterns(patterns: ProxyPattern[]): PacScriptPattern[] {
  const pacScriptPatterns: PacScriptPattern[] = [];

  patterns.forEach((pattern) => {
    if (!pattern.enabled) return;

    pacScriptPatterns.push({
      type: pattern.type,
      pattern: pattern.pattern,
    });
  });

  return pacScriptPatterns;
}

init().catch((err) => {
  console.error('init error: %O', err);
});
