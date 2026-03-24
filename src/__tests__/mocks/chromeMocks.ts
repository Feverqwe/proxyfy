/**
 * Type-safe mocks for Chrome Extension APIs
 *
 * Provides properly typed mock implementations for Chrome storage and other
 * extension APIs used in the application, eliminating the need for `as any` assertions.
 */

import {vi} from 'vitest';

// Type definitions for Chrome storage mocks
export interface ChromeStorageArea {
  get: (keys?: string | string[] | Record<string, any>) => Promise<Record<string, any>>;
  set: (items: Record<string, any>) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
  clear: () => Promise<void>;
  getBytesInUse: (keys?: string | string[]) => Promise<number>;
}

export interface ChromeStorageMock extends ChromeStorageArea {
  _data: Map<string, any>;
  _reset: () => void;
}

export interface ChromeRuntimeMock {
  lastError?: {message: string};
  onMessage: {
    addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
    removeListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
  };
  sendMessage: (message: any) => Promise<any>;
}

export interface ChromeProxyMock {
  settings: {
    get: (details: any) => Promise<any>;
    set: (details: any) => Promise<void>;
    clear: (details: any) => Promise<void>;
    onProxyError: {
      addListener: (callback: (details: any) => void) => void;
    };
  };
}

export interface ChromeMocks {
  storage: {
    local: ChromeStorageMock;
    sync: ChromeStorageMock;
  };
  runtime: ChromeRuntimeMock;
  proxy: ChromeProxyMock;
}

/**
 * Creates a type-safe mock implementation of Chrome storage area
 */
export function createChromeStorageMock(): ChromeStorageMock {
  const data = new Map<string, any>();

  const mock: ChromeStorageMock = {
    _data: data,
    _reset: () => data.clear(),

    async get(keys) {
      if (!keys) {
        // Return all data
        return Object.fromEntries(data);
      }

      if (typeof keys === 'string') {
        // Single key
        return {[keys]: data.get(keys)};
      }

      if (Array.isArray(keys)) {
        // Multiple keys
        const result: Record<string, any> = {};
        keys.forEach((key) => {
          result[key] = data.get(key);
        });
        return result;
      }

      // Object with default values
      const result: Record<string, any> = {};
      Object.keys(keys).forEach((key) => {
        result[key] = data.has(key) ? data.get(key) : keys[key];
      });
      return result;
    },

    async set(items) {
      Object.entries(items).forEach(([key, value]) => {
        data.set(key, value);
      });
    },

    async remove(keys) {
      if (typeof keys === 'string') {
        data.delete(keys);
      } else {
        keys.forEach((key) => data.delete(key));
      }
    },

    async clear() {
      data.clear();
    },

    async getBytesInUse(keys) {
      const dataToMeasure = keys ? await this.get(keys) : Object.fromEntries(data);
      return JSON.stringify(dataToMeasure).length;
    },
  };

  return mock;
}

/**
 * Creates a complete Chrome API mock with type-safe storage implementations
 */
export function createChromeMocks(): ChromeMocks {
  const localStorage = createChromeStorageMock();
  const syncStorage = createChromeStorageMock();

  const runtimeMock: ChromeRuntimeMock = {
    lastError: undefined,
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn().mockResolvedValue({}),
  };

  const proxyMock: ChromeProxyMock = {
    settings: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(),
      clear: vi.fn().mockResolvedValue(),
      onProxyError: {
        addListener: vi.fn(),
      },
    },
  };

  return {
    storage: {
      local: localStorage,
      sync: syncStorage,
    },
    runtime: runtimeMock,
    proxy: proxyMock,
  };
}

/**
 * Sets up global Chrome mocks for testing
 */
export function setupChromeMocks(): ChromeMocks {
  const mocks = createChromeMocks();

  // Set up global Chrome mock
  (globalThis as any).chrome = {
    storage: {
      local: mocks.storage.local,
      sync: mocks.storage.sync,
    },
    runtime: mocks.runtime,
    proxy: mocks.proxy,
  };

  return mocks;
}

/**
 * Resets all Chrome mocks to their initial state
 */
export function resetChromeMocks(mocks: ChromeMocks): void {
  mocks.storage.local._reset();
  mocks.storage.sync._reset();

  vi.resetAllMocks();

  // Reset runtime mock
  mocks.runtime.lastError = undefined;

  // Reset proxy mock
  vi.mocked(mocks.proxy.settings.get).mockClear();
  vi.mocked(mocks.proxy.settings.set).mockClear();
  vi.mocked(mocks.proxy.settings.clear).mockClear();
}
