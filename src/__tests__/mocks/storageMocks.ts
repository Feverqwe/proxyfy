/**
 * Type-safe mocks for Storage Service layer
 *
 * Provides properly typed mock implementations for StorageService and related
 * components, eliminating the need for `as any` assertions in tests.
 */

import {vi} from 'vitest';

import {StorageService} from '../../storage/StorageService';
import {StorageType} from '../../storage/StorageSettings';

// Type definitions for storage mocks
export interface MockStorageService extends StorageService {
  _data: Map<string, any>;
  _reset: () => void;
  _setError: (error: Error) => void;
  _clearError: () => void;
}

export interface MockStorageFactory {
  getStorageService: () => StorageService;
  switchStorageType: (type: StorageType) => Promise<void>;
  getCurrentStorageType: () => StorageType;
  createSpecificStorageService: (type: StorageType) => StorageService;
  _reset: () => void;
  _setStorageType: (type: StorageType) => void;
}

/**
 * Creates a type-safe mock implementation of StorageService
 */
export function createMockStorageService(): MockStorageService {
  const data = new Map<string, any>();
  let error: Error | null = null;

  const mock: MockStorageService = {
    _data: data,
    _reset: () => {
      data.clear();
      error = null;
    },
    _setError: (err: Error) => {
      error = err;
    },
    _clearError: () => {
      error = null;
    },

    async get(keys) {
      if (error) {
        throw error;
      }

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

      // Default to empty object if no keys provided
      return {};
    },

    async set(items) {
      if (error) {
        throw error;
      }

      Object.entries(items).forEach(([key, value]) => {
        data.set(key, value);
      });
    },

    async remove(keys) {
      if (error) {
        throw error;
      }

      if (typeof keys === 'string') {
        data.delete(keys);
      } else {
        keys.forEach((key) => data.delete(key));
      }
    },

    async clear() {
      if (error) {
        throw error;
      }

      data.clear();
    },

    async getBytesInUse(keys) {
      if (error) {
        throw error;
      }

      const dataToMeasure = keys ? await this.get(keys) : Object.fromEntries(data);
      return JSON.stringify(dataToMeasure).length;
    },
  };

  return mock;
}

/**
 * Creates a type-safe mock implementation of StorageFactory
 */
export function createMockStorageFactory(
  initialType: StorageType = StorageType.SYNC,
): MockStorageFactory {
  let currentStorageType = initialType;
  const mockService = createMockStorageService();

  const mock: MockStorageFactory = {
    _reset: () => {
      mockService._reset();
      currentStorageType = initialType;
    },
    _setStorageType: (type: StorageType) => {
      currentStorageType = type;
    },

    getStorageService: () => mockService,

    async switchStorageType(type: StorageType) {
      currentStorageType = type;
    },

    getCurrentStorageType: () => currentStorageType,

    createSpecificStorageService(_type: StorageType) {
      return createMockStorageService();
    },
  };

  return mock;
}

/**
 * Helper function to mock StorageFactory singleton with type safety
 */
export function mockStorageFactorySingleton(factory: MockStorageFactory): void {
  vi.doMock('../../storage/StorageFactory.js', () => ({
    StorageFactory: {
      getInstance: vi.fn(() => factory),
    },
  }));
}

/**
 * Helper function to mock StorageSettings singleton with type safety
 */
export function mockStorageSettingsSingleton(storageType: StorageType = StorageType.SYNC): {
  getStorageType: () => StorageType;
  setStorageType: (type: StorageType) => Promise<void>;
  isSyncStorage: () => boolean;
  isLocalStorage: () => boolean;
} {
  let currentType = storageType;

  return {
    getStorageType: () => currentType,
    async setStorageType(type: StorageType) {
      currentType = type;
    },
    isSyncStorage: () => currentType === StorageType.SYNC,
    isLocalStorage: () => currentType === StorageType.LOCAL,
  };
}

/**
 * Type-safe mock data generators for common test scenarios
 */
export const MockDataGenerators = {
  createProxyConfig: (
    overrides: Partial<{
      id: string;
      enabled: boolean;
      title: string;
      color: string;
      type: string;
      host: string;
      port: number;
      whitePatterns: string[];
      blackPatterns: string[];
    }> = {},
  ) => ({
    id: overrides.id || 'test-id',
    enabled: overrides.enabled ?? true,
    title: overrides.title || 'Test Proxy',
    color: overrides.color || '#66cc66',
    type: overrides.type || 'http',
    host: overrides.host || 'localhost',
    port: overrides.port || 8080,
    whitePatterns: overrides.whitePatterns || [],
    blackPatterns: overrides.blackPatterns || [],
    ...overrides,
  }),

  createStorageData: (overrides: Record<string, any> = {}) => ({
    proxies: [MockDataGenerators.createProxyConfig()],
    storageType: StorageType.SYNC,
    ...overrides,
  }),
};
