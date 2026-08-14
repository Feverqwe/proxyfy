import type {ConfigProxy} from '../src/tools/index';
import {DirectProxyType, GenericProxyType, ProxyPatternType} from '../src/tools/index';
import type {ProxyMode, ProxyState} from '../src/types/index';

type StorageData = Map<string, unknown>;
type RuntimeMessageListener = (message: Record<string, unknown>) => unknown;

const localData: StorageData = new Map();
const syncData: StorageData = new Map();
const messageListeners = new Set<RuntimeMessageListener>();

let proxyState: ProxyState = {mode: 'pac_script'};

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
        emitMessage({action: 'proxiesChanges'});
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

const isProxyMode = (value: unknown): value is ProxyMode => {
  return ['pac_script', 'system', 'fixed_servers', 'direct', 'auto_detect'].includes(String(value));
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
      if (!message || typeof message !== 'object') return undefined;

      const request = message as Record<string, unknown>;
      if (request.action === 'get') {
        return {...proxyState};
      }
      if (request.action === 'set' && isProxyMode(request.mode)) {
        proxyState = {
          mode: request.mode,
          id: typeof request.id === 'string' ? request.id : undefined,
        };
        emitMessage({action: 'stateChanges'});
      }

      return undefined;
    },
  },
  permissions: {
    request: async () => true,
  },
} as unknown as typeof chrome;

interface ConfigureChromeMockOptions {
  proxies?: ConfigProxy[];
  state?: ProxyState;
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
  proxyState = {...state};
};

export const installChromeMock = () => {
  configureChromeMock();
  if (typeof globalThis.chrome === 'object') {
    Object.assign(globalThis.chrome, chromeMock);
    return;
  }

  Object.defineProperty(globalThis, 'chrome', {configurable: true, value: chromeMock});
};
