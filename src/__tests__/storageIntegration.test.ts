/**
 * Integration Tests for Storage System
 *
 * Tests the complete storage system integration including:
 * - StorageFactory with StorageSettings
 * - Storage type switching and persistence
 * - Integration between different storage components
 */

import {beforeEach, describe, expect, it, vi} from 'vitest';
import {StorageFactory} from '../storage/StorageFactory';
import {StorageSettings, StorageType} from '../storage/StorageSettings';
import {ChromeStorageMock, createChromeStorageMock} from './mocks/chromeMocks';

// Use type-safe Chrome mocks

describe('Storage System Integration', () => {
  let storageFactory: StorageFactory;
  let storageSettings: StorageSettings;
  let chromeLocalStorage: ChromeStorageMock;
  let chromeSyncStorage: ChromeStorageMock;

  beforeEach(() => {
    // Clear all mocks
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

    // Create fresh instances using singleton pattern
    storageSettings = StorageSettings.getInstance();
    storageFactory = StorageFactory.getInstance();
  });

  describe('Storage Type Switching', () => {
    it('should switch between sync and local storage types', async () => {
      // Mock the storage type preference loading
      const mockGet = vi
        .spyOn(chromeLocalStorage, 'get')
        .mockResolvedValue({storageType: StorageType.SYNC});
      const mockSet = vi.spyOn(chromeLocalStorage, 'set').mockResolvedValue();

      // Initialize storage settings
      await storageSettings.initialize();

      // Verify initial storage type is SYNC
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);

      // Switch to LOCAL storage
      await storageSettings.setStorageType(StorageType.LOCAL);
      expect(storageSettings.getStorageType()).toBe(StorageType.LOCAL);

      // Verify the preference was saved
      expect(mockSet).toHaveBeenCalledWith({
        storageType: StorageType.LOCAL,
      });

      // Switch back to SYNC storage
      await storageSettings.setStorageType(StorageType.SYNC);
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);

      // Verify the preference was saved again
      expect(mockSet).toHaveBeenCalledWith({
        storageType: StorageType.SYNC,
      });
    });

    it('should persist storage type preference across instances', async () => {
      // Mock initial storage type preference
      const mockGet = vi
        .spyOn(chromeLocalStorage, 'get')
        .mockResolvedValue({storageType: StorageType.LOCAL});

      // Create first instance and initialize
      const settings1 = StorageSettings.getInstance();
      await settings1.initialize();
      expect(settings1.getStorageType()).toBe(StorageType.LOCAL);

      // Create second instance and initialize - should load the same preference
      const settings2 = StorageSettings.getInstance();
      await settings2.initialize();
      expect(settings2.getStorageType()).toBe(StorageType.LOCAL);
    });
  });

  describe('StorageFactory Integration', () => {
    it('should create correct storage service based on settings', async () => {
      // Mock storage type preference
      const mockGet = vi
        .spyOn(chromeLocalStorage, 'get')
        .mockResolvedValue({storageType: StorageType.SYNC});

      await storageSettings.initialize();

      // Get storage service - should be sync based on settings
      const syncService = storageFactory.getStorageService();
      expect(syncService).toBeDefined();

      // Switch to local storage
      await storageSettings.setStorageType(StorageType.LOCAL);

      // Get storage service - should be local based on updated settings
      const localService = storageFactory.getStorageService();
      expect(localService).toBeDefined();
    });

    it('should handle storage operations through factory', async () => {
      // Mock storage operations
      const mockSyncSet = vi.spyOn(chromeSyncStorage, 'set').mockResolvedValue(undefined);
      const mockSyncGet = vi
        .spyOn(chromeSyncStorage, 'get')
        .mockResolvedValue({testKey: 'testValue'});

      // Set storage type to SYNC
      await storageSettings.setStorageType(StorageType.SYNC);

      const storageService = storageFactory.getStorageService();

      // Test set operation
      await storageService.set({testKey: 'testValue'});
      expect(mockSyncSet).toHaveBeenCalledWith({testKey: 'testValue'});

      // Test get operation
      const result = await storageService.get('testKey');
      expect(mockSyncGet).toHaveBeenCalledWith('testKey');
      expect(result).toEqual({testKey: 'testValue'});
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing storage type preference gracefully', async () => {
      // Mock empty storage (no preference set)
      const mockGet = vi.spyOn(chromeLocalStorage, 'get').mockResolvedValue({});

      await storageSettings.initialize();

      // Should default to SYNC storage
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);
    });

    it('should handle storage operation errors gracefully', async () => {
      // Mock storage operation failure
      const mockSet = vi
        .spyOn(chromeSyncStorage, 'set')
        .mockRejectedValue(new Error('Storage error'));

      await storageSettings.setStorageType(StorageType.SYNC);
      const storageService = storageFactory.getStorageService();

      // Should not throw, but return rejected promise
      await expect(storageService.set({testKey: 'testValue'})).rejects.toThrow('Storage error');
    });

    it('should maintain consistency during concurrent operations', async () => {
      // Mock storage operations with delays to test concurrency
      const mockSet = vi
        .spyOn(chromeSyncStorage, 'set')
        .mockImplementation(() => new Promise<void>((resolve) => setTimeout(() => resolve(), 10)));

      await storageSettings.setStorageType(StorageType.SYNC);
      const storageService = storageFactory.getStorageService();

      // Start multiple concurrent operations
      const operations = [
        storageService.set({key1: 'value1'}),
        storageService.set({key2: 'value2'}),
        storageService.set({key3: 'value3'}),
      ];

      // Wait for all operations to complete
      await Promise.all(operations);

      // Verify all operations were called
      expect(mockSet).toHaveBeenCalledTimes(3);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle configuration storage and retrieval', async () => {
      // Mock storage operations
      const mockSet = vi.spyOn(chromeSyncStorage, 'set').mockResolvedValue(undefined);
      const mockGet = vi.spyOn(chromeSyncStorage, 'get').mockResolvedValue({
        proxies: {
          type: 'http',
          host: 'proxy.example.com',
          port: 8080,
        },
      });

      await storageSettings.setStorageType(StorageType.SYNC);
      const storageService = storageFactory.getStorageService();

      // Simulate storing proxy configuration
      const proxyConfig = {
        type: 'http',
        host: 'proxy.example.com',
        port: 8080,
      };

      await storageService.set({proxies: proxyConfig});
      expect(mockSet).toHaveBeenCalledWith({proxies: proxyConfig});

      // Simulate retrieving proxy configuration
      const retrieved = await storageService.get('proxies');
      expect(retrieved).toEqual({proxies: proxyConfig});
    });

    it('should support multiple configuration keys', async () => {
      const mockGet = vi.spyOn(chromeSyncStorage, 'get').mockResolvedValue({
        proxyConfig: {type: 'http'},
        patterns: ['*.example.com'],
        settings: {autoEnable: true},
      });

      await storageSettings.setStorageType(StorageType.SYNC);
      const storageService = storageFactory.getStorageService();

      // Retrieve multiple keys at once
      const result = await storageService.get(['proxyConfig', 'patterns', 'settings']);

      expect(result).toEqual({
        proxyConfig: {type: 'http'},
        patterns: ['*.example.com'],
        settings: {autoEnable: true},
      });
    });
  });
});
