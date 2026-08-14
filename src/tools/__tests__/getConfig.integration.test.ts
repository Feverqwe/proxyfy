/**
 * Integration tests for configuration reads
 *
 * Tests the integration between readConfig and the storage system
 */

import {beforeEach, describe, expect, it, vi} from 'vitest';

import {readConfig} from '../../services/config/configService';
import {ConfigRepositoryError} from '../../storage/ConfigRepository';
import {StorageFactory} from '../../storage/StorageFactory';
import {StorageSettings, StorageType} from '../../storage/StorageSettings';

// Use the global Chrome mock from vitest.setup.ts

describe('readConfig integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset StorageFactory instance
    (StorageFactory as any).instance = undefined;
  });

  describe('Configuration Retrieval', () => {
    it('should retrieve configuration from storage', async () => {
      // Mock valid configuration data using the correct Config structure
      const mockConfig = {
        proxies: [
          {
            id: 'proxy-1',
            enabled: true,
            title: 'Test Proxy',
            color: '#66cc66',
            type: 'http' as const,
            host: 'proxy.example.com',
            port: 8080,
            username: 'user',
            password: 'pass',
            whitePatterns: [
              {
                enabled: true,
                name: 'Example patterns',
                type: 'wildcard' as const,
                pattern: '*.example.com',
              },
            ],
            blackPatterns: [],
          },
        ],
      };

      const mockGet = vi.fn().mockResolvedValue(mockConfig);
      (chrome.storage.sync.get as any) = mockGet;

      // Set storage type to SYNC
      const storageSettings = StorageSettings.getInstance();
      await storageSettings.setStorageType(StorageType.SYNC);

      const result = await readConfig();

      expect(result).toEqual(mockConfig);
      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });

    it('should handle empty configuration gracefully', async () => {
      // Mock empty storage
      const mockGet = vi.fn().mockResolvedValue({});
      (chrome.storage.sync.get as any) = mockGet;

      const storageSettings = StorageSettings.getInstance();
      await storageSettings.setStorageType(StorageType.SYNC);

      const result = await readConfig();

      // readConfig returns default config when storage is empty
      expect(result).toEqual({proxies: []});
      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });

    it('should work with different storage types', async () => {
      const mockConfig = {
        proxies: [
          {
            id: 'proxy-1',
            enabled: true,
            title: 'Test Proxy',
            color: '#66cc66',
            type: 'http' as const,
            host: 'proxy.com',
            port: 8080,
            whitePatterns: [],
            blackPatterns: [],
          },
        ],
      };

      // Test with SYNC storage
      const mockSyncGet = vi.fn().mockResolvedValue(mockConfig);
      (chrome.storage.sync.get as any) = mockSyncGet;

      const storageSettings = StorageSettings.getInstance();
      await storageSettings.setStorageType(StorageType.SYNC);

      const resultSync = await readConfig();
      expect(resultSync).toEqual(mockConfig);
      expect(chrome.storage.sync.get).toHaveBeenCalled();

      // Reset and test with LOCAL storage
      vi.clearAllMocks();
      (StorageFactory as any).instance = undefined;

      const mockLocalGet = vi.fn().mockResolvedValue(mockConfig);
      (chrome.storage.local.get as any) = mockLocalGet;

      const storageSettings2 = StorageSettings.getInstance();
      await storageSettings2.setStorageType(StorageType.LOCAL);

      const resultLocal = await readConfig();
      expect(resultLocal).toEqual(mockConfig);
      expect(chrome.storage.local.get).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should report storage errors without returning an empty config', async () => {
      // Mock storage error
      const mockGet = vi.fn().mockRejectedValue(new Error('Storage error'));
      (chrome.storage.sync.get as any) = mockGet;

      const storageSettings = StorageSettings.getInstance();
      await storageSettings.setStorageType(StorageType.SYNC);

      await expect(readConfig()).rejects.toMatchObject<Partial<ConfigRepositoryError>>({
        code: 'unavailable',
      });
    });

    it('should report invalid configuration data', async () => {
      // Mock invalid configuration data
      const invalidConfig = {
        proxies: 'invalid', // Should be an array
      };

      const mockGet = vi.fn().mockResolvedValue(invalidConfig);
      (chrome.storage.sync.get as any) = mockGet;

      const storageSettings = StorageSettings.getInstance();
      await storageSettings.setStorageType(StorageType.SYNC);

      await expect(readConfig()).rejects.toMatchObject<Partial<ConfigRepositoryError>>({
        code: 'corrupt',
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent calls efficiently', async () => {
      const mockConfig = {
        proxies: [
          {
            id: 'proxy-1',
            enabled: true,
            title: 'Test Proxy',
            color: '#66cc66',
            type: 'http' as const,
            host: 'proxy.com',
            port: 8080,
            whitePatterns: [],
            blackPatterns: [],
          },
        ],
      };

      const mockGet = vi.fn().mockResolvedValue(mockConfig);
      (chrome.storage.sync.get as any) = mockGet;

      const storageSettings = StorageSettings.getInstance();
      await storageSettings.setStorageType(StorageType.SYNC);

      // Make multiple concurrent calls
      const promises = [readConfig(), readConfig(), readConfig()];

      const results = await Promise.all(promises);

      // All calls should return the same configuration
      results.forEach((result) => {
        expect(result).toEqual(mockConfig);
      });

      // Storage should be called multiple times (no caching in readConfig)
      expect(mockGet).toHaveBeenCalledTimes(3);
    });

    it('should work with large configuration data', async () => {
      // Mock large configuration data using the correct Config structure
      const largeConfig = {
        proxies: Array(1000)
          .fill(0)
          .map((_, i) => ({
            id: `proxy-${i}`,
            enabled: true,
            title: `Proxy ${i}`,
            color: '#66cc66',
            type: 'http' as const,
            host: `proxy${i}.com`,
            port: 8080,
            whitePatterns: [],
            blackPatterns: [],
          })),
      };

      const mockGet = vi.fn().mockResolvedValue(largeConfig);
      (chrome.storage.sync.get as any) = mockGet;

      const storageSettings = StorageSettings.getInstance();
      await storageSettings.setStorageType(StorageType.SYNC);

      const result = await readConfig();

      expect(result).toEqual(largeConfig);
      expect(result.proxies).toHaveLength(1000);
    });
  });

  describe('Integration with Storage System', () => {
    it('should respect storage type preferences', async () => {
      const mockConfig = {
        proxies: [
          {
            id: 'proxy-1',
            enabled: true,
            title: 'Test Proxy',
            color: '#66cc66',
            type: 'http' as const,
            host: 'proxy.com',
            port: 8080,
            whitePatterns: [],
            blackPatterns: [],
          },
        ],
      };

      // Set up mocks for both storage types
      const mockSyncGet = vi.fn().mockResolvedValue(mockConfig);
      const mockLocalGet = vi.fn().mockResolvedValue({});

      (chrome.storage.sync.get as any) = mockSyncGet;
      (chrome.storage.local.get as any) = mockLocalGet;

      // Test with SYNC storage
      const storageSettings = StorageSettings.getInstance();
      await storageSettings.setStorageType(StorageType.SYNC);

      const resultSync = await readConfig();
      expect(resultSync).toEqual(mockConfig);
      expect(chrome.storage.sync.get).toHaveBeenCalled();
      // chrome.storage.local.get is called by StorageSettings.initialize() to load storage type preference
      // So we can't check that it wasn't called at all

      // Reset and test with LOCAL storage
      vi.clearAllMocks();
      (StorageFactory as any).instance = undefined;

      const mockLocalGet2 = vi.fn().mockResolvedValue(mockConfig);
      const mockSyncGet2 = vi.fn().mockResolvedValue({});

      (chrome.storage.local.get as any) = mockLocalGet2;
      (chrome.storage.sync.get as any) = mockSyncGet2;

      const storageSettings2 = StorageSettings.getInstance();
      await storageSettings2.setStorageType(StorageType.LOCAL);

      const resultLocal = await readConfig();
      expect(resultLocal).toEqual(mockConfig);
      expect(chrome.storage.local.get).toHaveBeenCalled();
      // chrome.storage.sync.get is not called for configuration data when using LOCAL storage
      // But it might be called for other purposes, so we don't check this
    });
  });
});
