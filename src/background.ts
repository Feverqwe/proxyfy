import {Infer} from "superstruct";
import promisifyApi from "./tools/promisifyApi";
import getExtensionIcon from "./tools/getExtensionIcon";
import {Config, ProxyPatternStruct} from "./tools/ConfigStruct";
import getConfig from "./tools/getConfig";
import ChromeSettingGetResultDetails = chrome.types.ChromeSettingGetResultDetails;
import ChromeSettingClearDetails = chrome.types.ChromeSettingClearDetails;
import ChromeSettingSetDetails = chrome.types.ChromeSettingSetDetails;
import ColorArray = chrome.action.ColorArray;

type ProxyPattern = Infer<typeof ProxyPatternStruct>;

export type PacScriptPattern = Pick<ProxyPattern, 'type' | 'pattern'>; //  | 'protocol'

export type PacScript = {
  rules: ({
    type: 'http' | 'https' | 'socks4' | 'socks5',
    host: string,
    whitePatterns: PacScriptPattern[],
    blackPatterns: PacScriptPattern[],
  } | {
    type: 'direct',
    whitePatterns: PacScriptPattern[],
    blackPatterns: PacScriptPattern[],
  })[],
};

export class Background {
  defaultBadgeColor!: ColorArray;

  async init() {
    this.defaultBadgeColor = await promisifyApi<ColorArray>('chrome.action.getBadgeBackgroundColor')({});

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'set': {
          const {mode, id} = message;
          this.setProxy(mode, id);
          break;
        }
        case 'get': {
          getCurrentState().then((state) => {
            sendResponse(state);
          });
          return true;
        }
      }
    });
    chrome.storage.onChanged.addListener((changes, areaName) => {
      switch (areaName) {
        case 'sync': {
          if (changes.config) {
            this.applyConfig().catch((err) => {
              console.error('applyConfig error: %O', err);
            });
          }
          break;
        }
      }
    });
    chrome.proxy.onProxyError.addListener(({details, error, fatal}) => {
      console.error('[%s] Proxy error: %s %o', fatal ? 'fatal' : 'warn', details, error);
    });
    chrome.proxy.settings.onChange.addListener(() => {
      this.syncUiState().catch((err) => {
        console.error('Sync state error: %O', err);
      });
    });

    await this.syncUiState();
  }

  async syncUiState() {
    const state = await getCurrentState();

    let badgeColor = this.defaultBadgeColor;
    let badgeText = '';
    let icon = getExtensionIcon();

    if (state) {
      switch (state.mode) {
        case 'direct': {
          const config = await getConfig();
          const proxy = config.proxies.find((p) => p.type === 'direct');
          if (proxy) {
            badgeText = proxy.title;
            if (proxy.badgeColor) {
              badgeColor = proxy.badgeColor;
            }
            icon = getExtensionIcon(proxy.color);
          }
          break;
        }
        case 'fixed_servers': {
          const id = state.id;
          const config = await getConfig();
          const proxy = config.proxies.find(p => p.id === id);
          if (proxy) {
            badgeText = proxy.title;
            if (proxy.badgeColor) {
              badgeColor = proxy.badgeColor;
            }
            icon = getExtensionIcon(proxy.color);
          }
          break;
        }
        case 'pac_script': {
          badgeText = 'pattern';
          icon = getExtensionIcon('#0a77e5');
          break;
        }
      }
    }

    chrome.action.setBadgeText({
      text: badgeText
    });
    chrome.action.setBadgeBackgroundColor({
      color: badgeColor,
    });
    chrome.action.setIcon({
      imageData: icon
    });
  }

  async applyConfig() {
    const state = await getCurrentState();
    if (!state) return;

    await this.setProxy(state.mode, state.id);
  }

  async setProxy(mode: string, id?: string) {
    let value = null;
    switch (mode) {
      case "auto_detect": {
        value = {
          mode: 'auto_detect',
        };
        break;
      }
      case "fixed_servers": {
        const config = await getConfig();
        const proxy = config.proxies.find(proxy => proxy.id === id);
        if (proxy) {
          if (proxy.type === 'direct') {
            value = {
              mode: 'direct',
            };
          } else {
            value = {
              mode: 'fixed_servers',
              rules: {
                singleProxy: {
                  scheme: proxy.type,
                  host: proxy.host,
                  port: proxy.port,
                },
                bypassList: [encodeURIComponent(proxy.id) + '.proxyfy.localhost'],
              },
            };
          }
        }
        break;
      }
      case "patterns": {
        const config = await getConfig();
        value = {
          mode: 'pac_script',
          pacScript: {
            data: await getPacScript(config.proxies),
            mandatory: false,
          }
        };
        break;
      }
    }

    if (value) {
      await promisifyApi<ChromeSettingSetDetails>('chrome.proxy.settings.set')({value, scope: 'regular'});
    } else {
      await promisifyApi<ChromeSettingClearDetails>('chrome.proxy.settings.clear')({scope: 'regular'});
    }
  }
}

async function getCurrentState() {
  const proxySettings = await promisifyApi<ChromeSettingGetResultDetails>('chrome.proxy.settings.get')({
    incognito: false,
  });
  const {mode, rules} = proxySettings.value;
  let result: null | {mode: string, id?: string} = null;

  if (proxySettings.levelOfControl === 'controlled_by_this_extension') {
    result = {mode};
    if (mode === 'fixed_servers' && rules && rules.bypassList) {
      rules.bypassList.some((pattern: string) => {
        const m = /^(.+)\.proxyfy\.localhost/.exec(pattern);
        if (m) {
          const id = decodeURIComponent(m[1]);
          result = {mode, id};
          return true;
        }
      });
    }
  }
  return result;
}

async function getPacScript(proxies: Config['proxies']) {
  const rules: PacScript['rules'] = [];
  proxies.forEach((proxy) => {
    if (!proxy.enabled) return;

    switch (proxy.type) {
      case "direct": {
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
          whitePatterns: getPatterns(proxy.whitePatterns),
          blackPatterns: getPatterns(proxy.blackPatterns),
        });
      }
    }
  });

  const config: PacScript = {rules};

  const pacScript = await fetch('./pacScript.js')
    .then(r => r.text())
    .then(t => t.replace(/[^\x00-\x7F]/g, ''));

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

const background = new Background();
background.init();
