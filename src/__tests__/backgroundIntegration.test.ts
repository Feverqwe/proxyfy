/**
 * Integration Tests for Background Script
 *
 * Tests the integration between background script and storage system
 */

import {beforeEach, describe, expect, it, vi} from 'vitest';
import {StorageFactory} from '../storage/StorageFactory.js';
import {StorageSettings, StorageType} from '../storage/StorageSettings.js';
import {ChromeStorageMock, createChromeStorageMock} from './mocks/chromeMocks.js';

// Mock the background script functionality
const setupBackgroundScript = () => {
  let storageFactory: StorageFactory | null = null;

  const initializeStorage = async () => {
    storageFactory = StorageFactory.getInstance();
    await storageFactory.initialize();
    const storageSettings = StorageSettings.getInstance();
    return {storageFactory, storageSettings};
  };

  const getProxyConfig = async () => {
    if (!storageFactory) {
      await initializeStorage();
    }
    const storageService = storageFactory!.getStorageService();
    return storageService.get('proxies');
  };

  const setProxyConfig = async (config: any) => {
    if (!storageFactory) {
      await initializeStorage();
    }
    const storageService = storageFactory!.getStorageService();
    return storageService.set({proxies: config});
  };

  const reinitializeStorageFactory = async () => {
    if (storageFactory) {
      await storageFactory.initialize();
    }
  };

  return {
    initializeStorage,
    getProxyConfig,
    setProxyConfig,
    getStorageFactory: () => storageFactory,
    reinitializeStorageFactory,
  };
};

describe('Background Script Integration', () => {
  let backgroundScript: ReturnType<typeof setupBackgroundScript>;
  let chromeLocalStorage: ChromeStorageMock;
  let chromeSyncStorage: ChromeStorageMock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create type-safe Chrome storage mocks
    chromeLocalStorage = createChromeStorageMock();
    chromeSyncStorage = createChromeStorageMock();

    // Set up global Chrome mocks
    (globalThis as any).chrome = {
      storage: {
        local: chromeLocalStorage,
        sync: chromeSyncStorage,
      },
    };

    // Reset singleton instances
    (StorageFactory as any).instance = undefined;
    (StorageSettings as any).instance = undefined;
    backgroundScript = setupBackgroundScript();
  });

  describe('Storage Initialization', () => {
    it('should initialize storage system on startup', async () => {
      // Mock storage type preference
      const mockGet = vi.spyOn(chromeLocalStorage, 'get').mockResolvedValue({storageType: StorageType.SYNC});

      const {storageFactory, storageSettings} = await backgroundScript.initializeStorage();

      expect(storageFactory).toBeInstanceOf(StorageFactory);
      expect(storageSettings).toBeInstanceOf(StorageSettings);
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);
    });

    it('should handle missing storage type preference gracefully', async () => {
      // Mock empty storage (no preference set)
      const mockGet = vi.spyOn(chromeLocalStorage, 'get').mockResolvedValue({});

      const {storageSettings} = await backgroundScript.initializeStorage();

      // Should default to SYNC storage
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);
    });
  });

  describe('Proxy Configuration Management', () => {
    it('should store and retrieve proxy configuration', async () => {
      // Mock storage operations
      const mockSet = vi.spyOn(chromeSyncStorage, 'set').mockResolvedValue(undefined);
      const mockGet = vi.spyOn(chromeSyncStorage, 'get').mockResolvedValue({
        proxies: {
          type: 'http',
          host: 'proxy.example.com',
          port: 8080,
        },
      });

      // Set storage type to SYNC
      const storageSettings = StorageSettings.getInstance();
      await storageSettings.setStorageType(StorageType.SYNC);

      // Store proxy configuration
      const proxyConfig = {
        type: 'http',
        host: 'proxy.example.com',
        port: 8080,
      };

      await backgroundScript.setProxyConfig(proxyConfig);

      // Verify storage operation
      expect(mockSet).toHaveBeenCalledWith({proxies: proxyConfig});

      // Retrieve proxy configuration
      const retrieved = await backgroundScript.getProxyConfig();
      expect(retrieved).toEqual({proxies: proxyConfig});
      expect(mockGet).toHaveBeenCalledWith('proxies');
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage error
      const mockSet = vi.spyOn(chromeSyncStorage, 'set').mockRejectedValue(new Error('Storage error'));

      const proxyConfig = {
        type: 'http',
        host: 'proxy.example.com',
        port: 8080,
      };

      // Should not throw, but return rejected promise
      await expect(backgroundScript.setProxyConfig(proxyConfig)).rejects.toThrow('Storage error');
    });
  });

  describe('Storage Type Switching', () => {
    it('should maintain consistency when switching storage types', async () => {
      // Mock storage operations for both storage types
      const mockSyncSet = vi.spyOn(chromeSyncStorage, 'set').mockResolvedValue(undefined);
      const mockLocalSet = vi.spyOn(chromeLocalStorage, 'set').mockResolvedValue(undefined);
      const mockSyncGet = vi.spyOn(chromeSyncStorage, 'get').mockResolvedValue({});
      const mockLocalGet = vi.spyOn(chromeLocalStorage, 'get').mockResolvedValue({});

      // Initialize with SYNC storage
      const {storageSettings} = await backgroundScript.initializeStorage();

      // Store data in SYNC storage
      const proxyConfig = {type: 'http', host: 'proxy.example.com', port: 8080};
      await backgroundScript.setProxyConfig(proxyConfig);

      // Should use SYNC storage
      expect(mockSyncSet).toHaveBeenCalledWith({proxies: proxyConfig});
      expect(mockLocalSet).not.toHaveBeenCalled();

      // Switch to LOCAL storage using the storage factory's switch method
      const storageFactory = backgroundScript.getStorageFactory();
      await storageFactory!.switchStorageType(StorageType.LOCAL);

      // Clear mock calls
      vi.clearAllMocks();

      // Store data after switching
      const newConfig = {type: 'socks', host: 'proxy2.example.com', port: 9090};
      await backgroundScript.setProxyConfig(newConfig);

      // Should now use LOCAL storage
      expect(mockLocalSet).toHaveBeenCalledWith({proxies: newConfig});
      expect(mockSyncSet).not.toHaveBeenCalled();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle multiple configuration updates', async () => {
      // Mock storage operations
      const mockSet = vi.spyOn(chromeSyncStorage, 'set').mockResolvedValue(undefined);

      // Simulate multiple configuration updates
      const configs = [
        {type: 'http', host: 'proxy1.com', port: 8080},
        {type: 'https', host: 'proxy2.com', port: 443},
        {type: 'socks', host: 'proxy3.com', port: 1080},
      ];

      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        // eslint-disable-next-line no-await-in-loop
        await backgroundScript.setProxyConfig(config);
      }

      // Should have stored each configuration
      expect(mockSet).toHaveBeenCalledTimes(configs.length);

      configs.forEach((config, index) => {
        expect(mockSet).toHaveBeenNthCalledWith(index + 1, {proxies: config});
      });
    });

    it('should handle concurrent storage operations', async () => {
      // Mock storage operations with delays
      const mockSet = vi.spyOn(chromeSyncStorage, 'set').mockImplementation(
        () =>
          // eslint-disable-next-line no-promise-executor-return
          new Promise<void>((resolve) => setTimeout(() => resolve(), 10)),
      );

      // Start multiple concurrent operations
      const operations = [
        backgroundScript.setProxyConfig({type: 'http', host: 'proxy1.com', port: 8080}),
        backgroundScript.setProxyConfig({type: 'https', host: 'proxy2.com', port: 443}),
        backgroundScript.setProxyConfig({type: 'socks', host: 'proxy3.com', port: 1080}),
      ];

      // Wait for all operations to complete
      await Promise.all(operations);

      // All operations should complete successfully
      expect(mockSet).toHaveBeenCalledTimes(3);
    });
  });
});
