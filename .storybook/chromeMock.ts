import {
  cloneProxy,
  moveProxy,
  removeProxy,
  replaceProxyPatterns,
  saveProxy,
  setProxyEnabled,
} from '../src/domain/proxy/configMutations';
import {stripProxyCredentials} from '../src/domain/proxy/proxyCredentials';
import type {BackgroundRequest} from '../src/services/runtime/runtimeContract';
import {RuntimeAction, parseBackgroundRequest} from '../src/services/runtime/runtimeContract';
import type {ConfigProxy} from '../src/tools/index';
import {DirectProxyType, GenericProxyType, ProxyPatternType} from '../src/tools/index';
import type {ProxyState} from '../src/types/index';

type StorageData = Map<string, unknown>;
type RuntimeMessageListener = (message: Record<string, unknown>) => unknown;

const localData: StorageData = new Map();
const syncData: StorageData = new Map();
const messageListeners = new Set<RuntimeMessageListener>();

let proxyState: ProxyState | null = {mode: 'pac_script'};
let activeStorageType: 'sync' | 'local' = 'sync';

export const storyProxies: ConfigProxy[] = [
  {
    id: 'office',
    enabled: true,
    title: 'Office HTTPS',
    color: '#1976d2',
    badgeText: 'OFF',
    badgeColor: 'rgba(25, 118, 210, 1)',
    type: GenericProxyType.Https,
    host: 'proxy.office.example',
    port: 8443,
    username: 'designer',
    password: 'storybook-only',
    whitePatterns: [
      {
        enabled: true,
        name: 'Company services',
        type: ProxyPatternType.Wildcard,
        pattern: '*.office.example',
      },
    ],
    blackPatterns: [
      {
        enabled: true,
        name: 'Localhost',
        type: ProxyPatternType.Wildcard,
        pattern: 'localhost',
      },
    ],
  },
  {
    id: 'development',
    enabled: true,
    title: 'Development SOCKS5',
    color: '#7b1fa2',
    badgeText: 'DEV',
    badgeColor: 'rgba(123, 31, 162, 1)',
    type: GenericProxyType.Socks5,
    host: '127.0.0.1',
    port: 1080,
    whitePatterns: [],
    blackPatterns: [],
  },
  {
    id: 'staging',
    enabled: false,
    title: 'Staging HTTP',
    color: '#ed6c02',
    badgeText: 'STG',
    badgeColor: 'rgba(237, 108, 2, 1)',
    type: GenericProxyType.Http,
    host: 'proxy.staging.example',
    port: 3128,
    whitePatterns: [],
    blackPatterns: [],
  },
  {
    id: 'direct',
    enabled: true,
    title: 'Direct connection',
    color: '#2e7d32',
    type: DirectProxyType.Direct,
    whitePatterns: [],
    blackPatterns: [],
  },
];

const cloneProxies = (proxies: ConfigProxy[]) => structuredClone(proxies);

const getStorageValues = (
  data: StorageData,
  keys?: string | string[] | Record<string, unknown> | null,
) => {
  if (keys === undefined || keys === null) {
    return Object.fromEntries(data);
  }

  if (typeof keys === 'string') {
    return data.has(keys) ? {[keys]: data.get(keys)} : {};
  }

  if (Array.isArray(keys)) {
    return Object.fromEntries(
      keys.filter((key) => data.has(key)).map((key) => [key, data.get(key)]),
    );
  }

  return Object.fromEntries(
    Object.entries(keys).map(([key, defaultValue]) => [
      key,
      data.has(key) ? data.get(key) : defaultValue,
    ]),
  );
};

const emitMessage = (message: Record<string, unknown>) => {
  messageListeners.forEach((listener) => listener(message));
};

const createStorageArea = (data: StorageData) => {
  return {
    get: async (keys?: string | string[] | Record<string, unknown> | null) => {
      return getStorageValues(data, keys);
    },
    set: async (items: Record<string, unknown>) => {
      Object.entries(items).forEach(([key, value]) => data.set(key, value));
      if ('proxies' in items) {
        emitMessage({action: RuntimeAction.ProxiesChanged});
      }
    },
    remove: async (keys: string | string[]) => {
      const keysToRemove = typeof keys === 'string' ? [keys] : keys;
      keysToRemove.forEach((key) => data.delete(key));
    },
    clear: async () => {
      data.clear();
    },
    getBytesInUse: async (keys?: string | string[] | null) => {
      return new Blob([JSON.stringify(getStorageValues(data, keys))]).size;
    },
  };
};

const getActiveStorage = () => (activeStorageType === 'sync' ? syncData : localData);

const getActiveConfig = () => ({
  proxies: cloneProxies((getActiveStorage().get('proxies') as ConfigProxy[] | undefined) || []),
});

const setActiveConfig = (config: {proxies: ConfigProxy[]}) => {
  getActiveStorage().set('proxies', cloneProxies(config.proxies));
  emitMessage({action: RuntimeAction.ProxiesChanged});
};

const handleRuntimeRequest = (request: BackgroundRequest) => {
  switch (request.action) {
    case RuntimeAction.GetState:
      return proxyState ? {...proxyState} : null;
    case RuntimeAction.SetProxy:
      proxyState = {mode: request.mode, id: request.id};
      emitMessage({action: RuntimeAction.StateChanged});
      return;
    case RuntimeAction.GetConfig:
      return getActiveConfig();
    case RuntimeAction.GetExportConfig:
      return stripProxyCredentials(getActiveConfig());
    case RuntimeAction.GetStorageSettings:
      return {
        storageType: activeStorageType,
        defaultIconColor: String(localData.get('defaultIconColor') || '#0a77e5'),
      };
    case RuntimeAction.SetDefaultIconColor:
      localData.set('defaultIconColor', request.color);
      return;
    case RuntimeAction.ReplaceConfig:
      setActiveConfig(request.config);
      return;
    case RuntimeAction.SaveProxy:
      setActiveConfig(saveProxy(getActiveConfig(), request.proxy, request.isNew));
      return;
    case RuntimeAction.RemoveProxy:
      setActiveConfig(removeProxy(getActiveConfig(), request.proxyId));
      return;
    case RuntimeAction.MoveProxy:
      setActiveConfig(moveProxy(getActiveConfig(), request.proxyId, request.offset));
      return;
    case RuntimeAction.SetProxyEnabled:
      setActiveConfig(setProxyEnabled(getActiveConfig(), request.proxyId, request.enabled));
      return;
    case RuntimeAction.CloneProxy:
      setActiveConfig(cloneProxy(getActiveConfig(), request.proxyId, request.cloneId));
      return;
    case RuntimeAction.ReplaceProxyPatterns:
      setActiveConfig(
        replaceProxyPatterns(
          getActiveConfig(),
          request.proxyId,
          request.whitePatterns,
          request.blackPatterns,
        ),
      );
      return;
    case RuntimeAction.SwitchStorage: {
      const previousConfig = getActiveConfig();
      activeStorageType = request.storageType;
      localData.set('storageType', activeStorageType);
      setActiveConfig(previousConfig);
    }
  }
};

const chromeMock = {
  storage: {
    local: createStorageArea(localData),
    sync: createStorageArea(syncData),
  },
  runtime: {
    onMessage: {
      addListener: (listener: RuntimeMessageListener) => messageListeners.add(listener),
      removeListener: (listener: RuntimeMessageListener) => messageListeners.delete(listener),
    },
    sendMessage: async (message: unknown) => {
      const request = parseBackgroundRequest(message);
      return request ? handleRuntimeRequest(request) : undefined;
    },
  },
  permissions: {
    request: async () => true,
  },
} as unknown as typeof chrome;

interface ConfigureChromeMockOptions {
  proxies?: ConfigProxy[];
  state?: ProxyState | null;
}

export const configureChromeMock = ({
  proxies = storyProxies,
  state = {mode: 'pac_script'},
}: ConfigureChromeMockOptions = {}) => {
  const storage = {
    proxies: cloneProxies(proxies),
    storageType: 'sync',
    defaultIconColor: '#0a77e5',
  };

  localData.clear();
  syncData.clear();
  Object.entries(storage).forEach(([key, value]) => {
    localData.set(key, structuredClone(value));
    syncData.set(key, structuredClone(value));
  });
  proxyState = state ? {...state} : null;
  activeStorageType = 'sync';
};

export const installChromeMock = () => {
  configureChromeMock();
  if (typeof globalThis.chrome === 'object') {
    Object.assign(globalThis.chrome, chromeMock);
    return;
  }

  Object.defineProperty(globalThis, 'chrome', {configurable: true, value: chromeMock});
};
