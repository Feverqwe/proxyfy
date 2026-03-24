/**
 * Integration Tests for Storage System
 *
 * Tests the complete storage system integration including:
 * - StorageFactory with StorageSettings
 * - Storage type switching and persistence
 * - Integration between different storage components
 */

import {vi, describe, beforeEach, it, expect} from 'vitest';
import {StorageFactory} from '../storage/StorageFactory.js';
import {StorageSettings, StorageType} from '../storage/StorageSettings.js';

// Use the global Chrome mock from vitest.setup.ts

describe('Storage System Integration', () => {
  let storageFactory: StorageFactory;
  let storageSettings: StorageSettings;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create fresh instances using singleton pattern
    storageSettings = StorageSettings.getInstance();
    storageFactory = StorageFactory.getInstance();
  });

  describe('Storage Type Switching', () => {
    it('should switch between sync and local storage types', async () => {
      // Mock the storage type preference loading
      const mockGet = vi.fn().mockResolvedValue({storageType: StorageType.SYNC});
      (chrome.storage.local.get as any) = mockGet;

      // Initialize storage settings
      await storageSettings.initialize();

      // Verify initial storage type is SYNC
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);

      // Switch to LOCAL storage
      await storageSettings.setStorageType(StorageType.LOCAL);
      expect(storageSettings.getStorageType()).toBe(StorageType.LOCAL);

      // Verify the preference was saved
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        storageType: StorageType.LOCAL,
      });

      // Switch back to SYNC storage
      await storageSettings.setStorageType(StorageType.SYNC);
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);

      // Verify the preference was saved again
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        storageType: StorageType.SYNC,
      });
    });

    it('should persist storage type preference across instances', async () => {
      // Mock initial storage type preference
      const mockGet = vi.fn().mockResolvedValue({storageType: StorageType.LOCAL});
      (chrome.storage.local.get as any) = mockGet;

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
      const mockGet = vi.fn().mockResolvedValue({storageType: StorageType.SYNC});
      (chrome.storage.local.get as any) = mockGet;

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
      const mockSyncSet = vi.fn().mockResolvedValue(undefined);
      const mockSyncGet = vi.fn().mockResolvedValue({testKey: 'testValue'});

      (chrome.storage.sync.set as any) = mockSyncSet;
      (chrome.storage.sync.get as any) = mockSyncGet;

      // Set storage type to SYNC
      await storageSettings.setStorageType(StorageType.SYNC);

      const storageService = storageFactory.getStorageService();

      // Test set operation
      await storageService.set({testKey: 'testValue'});
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({testKey: 'testValue'});

      // Test get operation
      const result = await storageService.get('testKey');
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('testKey');
      expect(result).toEqual({testKey: 'testValue'});
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing storage type preference gracefully', async () => {
      // Mock empty storage (no preference set)
      const mockGet = vi.fn().mockResolvedValue({});
      (chrome.storage.local.get as any) = mockGet;

      await storageSettings.initialize();

      // Should default to SYNC storage
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);
    });

    it('should handle storage operation errors gracefully', async () => {
      // Mock storage operation failure
      const mockSet = vi.fn().mockRejectedValue(new Error('Storage error'));
      (chrome.storage.sync.set as any) = mockSet;

      await storageSettings.setStorageType(StorageType.SYNC);
      const storageService = storageFactory.getStorageService();

      // Should not throw, but return rejected promise
      await expect(storageService.set({testKey: 'testValue'})).rejects.toThrow('Storage error');
    });

    it('should maintain consistency during concurrent operations', async () => {
      // Mock storage operations with delays to test concurrency
      const mockSet = vi.fn().mockImplementation(
        () =>
          // eslint-disable-next-line no-promise-executor-return
          new Promise<void>((resolve) => setTimeout(() => resolve(), 10)),
      );
      (chrome.storage.sync.set as any) = mockSet;

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
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({
        proxies: {
          type: 'http',
          host: 'proxy.example.com',
          port: 8080,
        },
      });

      (chrome.storage.sync.set as any) = mockSet;
      (chrome.storage.sync.get as any) = mockGet;

      await storageSettings.setStorageType(StorageType.SYNC);
      const storageService = storageFactory.getStorageService();

      // Simulate storing proxy configuration
      const proxyConfig = {
        type: 'http',
        host: 'proxy.example.com',
        port: 8080,
      };

      await storageService.set({proxies: proxyConfig});
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({proxies: proxyConfig});

      // Simulate retrieving proxy configuration
      const retrieved = await storageService.get('proxies');
      expect(retrieved).toEqual({proxies: proxyConfig});
    });

    it('should support multiple configuration keys', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        proxyConfig: {type: 'http'},
        patterns: ['*.example.com'],
        settings: {autoEnable: true},
      });

      (chrome.storage.sync.get as any) = mockGet;

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
