import * as s from "superstruct";
import {Infer} from "superstruct";
import promisifyApi from "./tools/promisifyApi";
import ChromeSettingGetResultDetails = chrome.types.ChromeSettingGetResultDetails;
import StorageChange = chrome.storage.StorageChange;
import ChromeSettingClearDetails = chrome.types.ChromeSettingClearDetails;
import ChromeSettingSetDetails = chrome.types.ChromeSettingSetDetails;
import ColorArray = chrome.action.ColorArray;
import getExtensionIcon from "./tools/getExtensionIcon";

type Config = Infer<typeof ConfigStruct>;
type ProxyPattern = Infer<typeof ProxyPatternStruct>;

const ProxyPatternStruct = s.type({
  enabled: s.boolean(),
  name: s.string(),
  type: s.union([s.literal('wildcard'), s.literal('regexp')]),
  pattern: s.string(),
  // protocol: s.nullable(s.union([s.literal('http'), s.literal('https')]))
});

const ConfigStruct = s.type({
  mode: s.union([
    s.literal('patterns'),
    s.literal('fixed_servers'),
    s.literal('auto_detect'),
    s.literal('system'),
    s.literal('direct'),
  ]),
  fixedProxyId: s.nullable(s.string()),
  proxies: s.array(s.type({
    id: s.string(),
    enabled: s.boolean(),
    title: s.string(),
    color: s.optional(s.string()),
    badgeColor: s.optional(s.tuple([s.number(), s.number(), s.number(), s.number()])),
    scheme: s.union([s.literal('http'), s.literal('https'), s.literal('socks4'), s.literal('socks5')]),
    host: s.string(),
    port: s.number(),
    username: s.string(),
    password: s.string(),
    whitePatterns: s.array(ProxyPatternStruct),
    blackPatterns: s.array(ProxyPatternStruct),
  })),
});

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
    let icon: ImageData | null = null;

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
              icon = await getExtensionIcon(proxy.color);
            }
          }
          break;
        }
        case 'pac_script': {
          badgeText = 'pattern';
          icon = await getExtensionIcon('#0a77e5');
          break;
        }
        default: {
          // badgeText = 'other';
          // badgeColor = [255,215,0,1];
          // icon = await getExtensionIcon('#0a77e5');
        }
      }
    }

    chrome.action.setBadgeText({
      text: badgeText
    });
    chrome.action.setBadgeBackgroundColor({
      color: badgeColor,
    });
    if (icon) {
      chrome.action.setIcon({
        imageData: icon
      });
    }
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
