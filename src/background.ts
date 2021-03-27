import * as s from "superstruct";
import {Infer} from "superstruct";
import promisifyApi from "./tools/promisifyApi";
import ChromeSettingGetResultDetails = chrome.types.ChromeSettingGetResultDetails;
import StorageChange = chrome.storage.StorageChange;
import ChromeSettingClearDetails = chrome.types.ChromeSettingClearDetails;
import ChromeSettingSetDetails = chrome.types.ChromeSettingSetDetails;
import ColorArray = chrome.action.ColorArray;
import getExtensionIcon from "./tools/getExtensionIcon";
import ConfigStruct, {ProxyPatternStruct} from "./tools/ConfigStruct";

type Config = Infer<typeof ConfigStruct>;
type ProxyPattern = Infer<typeof ProxyPatternStruct>;

type PacScriptPattern = Pick<ProxyPattern, 'type' | 'pattern'>; //  | 'protocol'

export type PacScript = {
  rules: {
    scheme: 'http' | 'https' | 'socks4' | 'socks5',
    host: string,
    whitePatterns: PacScriptPattern[],
    blackPatterns: PacScriptPattern[],
  }[],
};

export class Background {
  defaultBadgeColor!: ColorArray;

  async init() {
    this.defaultBadgeColor = await promisifyApi<ColorArray>('chrome.action.getBadgeBackgroundColor')({});

    chrome.storage.onChanged.addListener(this.handleStorageChanged);

    await this.syncState();
  }

  async syncState() {
    const state = await getCurrentState();

    let badgeColor = this.defaultBadgeColor;
    let badgeText = '';
    let icon = getExtensionIcon();

    if (state) {
      switch (state?.mode) {
        case 'fixed_servers': {
          const id = state.id;
          const config = await getConfig();
          const proxy = config.proxies.find(p => p.id === id);
          if (proxy) {
            badgeText = proxy.title;
            if (proxy.badgeColor) {
              badgeColor = proxy.badgeColor;
            }
            if (proxy.color) {
              icon = getExtensionIcon(proxy.color);
            }
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

  async applyConfig(config: Config) {
    await promisifyApi<ChromeSettingClearDetails>('chrome.proxy.settings.clear')({scope: 'regular'});

    let value = null;
    switch (config.mode) {
      case "auto_detect": {
        value = {
          mode: 'auto_detect',
        };
        break;
      }
      case "system": {
        value = {
          mode: 'system',
        };
        break;
      }
      case "direct": {
        value = {
          mode: 'direct',
        };
        break;
      }
      case "fixed_servers": {
        const proxy = config.proxies.find(proxy => proxy.id === config.fixedProxyId);
        if (proxy) {
          value = {
            mode: 'fixed_servers',
            rules: {
              singleProxy: {
                scheme: proxy.scheme,
                host: proxy.host,
                port: proxy.port,
              }
            },
          };
        }
        break;
      }
      case "patterns": {
        value = {
          mode: 'pac_script',
          pacScript: {
            data: await getPacScript(config.proxies),
            mandatory: false,
          }
        };
      }
    }

    if (value) {
      await promisifyApi<ChromeSettingSetDetails>('chrome.proxy.settings.set')({value, scope: 'regular'});
    }
  }

  handleStorageChanged = (changes: Record<string, StorageChange>, areaName: string) => {
    switch (areaName) {
      case 'sync': {
        if (changes.config) {
          this.applyConfig(changes.config.newValue);
        }
        break;
      }
    }
  };
}

async function getCurrentState() {
  const proxySettings = await promisifyApi<ChromeSettingGetResultDetails>('chrome.proxy.settings.get')({
    incognito: false,
  });
  const {mode, rules} = proxySettings.value;
  let result: null | {mode: string, id?: string} = null;

  if (['direct', 'auto_detect', 'system'].includes(mode)) {
    result = {mode: mode};
  }

  if (proxySettings.levelOfControl === 'controlled_by_this_extension') {
    if (mode === 'pac_script') {
      result = {mode};
    } else
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

    return {
      scheme: proxy.scheme,
      host: proxy.host,
      whitePatterns: getPatterns(proxy.whitePatterns),
      blackPatterns: getPatterns(proxy.blackPatterns),
    };
  });

  const config: PacScript = {rules};

  const pacScript = await fetch('./pacScript.js')
    .then(r => r.text())
    .then(t => t.replace(/[^\x00-\x7F]/g, ''));

  return `let FindProxyForURL=null;\nlet Config=${JSON.stringify(config)};\n${pacScript};`;
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

async function getConfig() {
  return promisifyApi<Config>('chrome.storage.sync.get')();
}

const background = new Background();
background.init();
