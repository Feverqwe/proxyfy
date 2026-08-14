/**
 * Tests for StorageSettings class
 */
import {Mock, beforeEach, describe, expect, it, vi} from 'vitest';

import {StorageSettings, StorageType} from '../StorageSettings';

describe('StorageSettings', () => {
  let storageSettings: StorageSettings;

  beforeEach(() => {
    // Clear the singleton instance before each test
    (StorageSettings as any).instance = undefined;
    storageSettings = StorageSettings.getInstance();

    // Mock chrome.storage.local
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StorageSettings.getInstance();
      const instance2 = StorageSettings.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should load storage type from chrome.storage', async () => {
      const mockGet = chrome.storage.local.get as Mock;
      mockGet.mockResolvedValue({
        storageType: StorageType.LOCAL,
        defaultIconColor: '#ff0000',
      });

      await storageSettings.initialize();

      expect(mockGet).toHaveBeenCalledWith(['storageType', 'defaultIconColor']);
      expect(storageSettings.getStorageType()).toBe(StorageType.LOCAL);
      expect(storageSettings.getDefaultIconColor()).toBe('#ff0000');
    });

    it('should use defaults when no values are stored', async () => {
      const mockGet = chrome.storage.local.get as Mock;
      mockGet.mockResolvedValue({});

      await storageSettings.initialize();

      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);
      expect(storageSettings.getDefaultIconColor()).toBe('#0a77e5');
    });

    it('should handle errors gracefully', async () => {
      const mockGet = chrome.storage.local.get as Mock;
      mockGet.mockRejectedValue(new Error('Storage error'));

      await expect(storageSettings.initialize()).resolves.not.toThrow();

      // Should still have default values
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);
      expect(storageSettings.getDefaultIconColor()).toBe('#0a77e5');
    });
  });

  describe('storage type management', () => {
    it('should set and get storage type', async () => {
      const mockSet = chrome.storage.local.set as Mock;
      mockSet.mockResolvedValue(undefined);

      await storageSettings.setStorageType(StorageType.LOCAL);

      expect(mockSet).toHaveBeenCalledWith({storageType: StorageType.LOCAL});
      expect(storageSettings.getStorageType()).toBe(StorageType.LOCAL);
    });

    it('should retain the active type when persistence fails', async () => {
      const mockSet = chrome.storage.local.set as Mock;
      mockSet.mockRejectedValue(new Error('Storage error'));

      await expect(storageSettings.setStorageType(StorageType.LOCAL)).rejects.toThrow(
        'Storage error',
      );
      expect(storageSettings.getStorageType()).toBe(StorageType.SYNC);
    });

    it('should check storage type correctly', async () => {
      await storageSettings.setStorageType(StorageType.SYNC);
      expect(storageSettings.isSyncStorage()).toBe(true);
      expect(storageSettings.isLocalStorage()).toBe(false);

      await storageSettings.setStorageType(StorageType.LOCAL);
      expect(storageSettings.isSyncStorage()).toBe(false);
      expect(storageSettings.isLocalStorage()).toBe(true);
    });
  });

  describe('default icon color management', () => {
    it('should set and get default icon color', async () => {
      const mockSet = chrome.storage.local.set as Mock;
      mockSet.mockResolvedValue(undefined);

      await storageSettings.setDefaultIconColor('#00ff00');

      expect(mockSet).toHaveBeenCalledWith({defaultIconColor: '#00ff00'});
      expect(storageSettings.getDefaultIconColor()).toBe('#00ff00');
    });

    it('should handle color persistence errors', async () => {
      const mockSet = chrome.storage.local.set as Mock;
      mockSet.mockRejectedValue(new Error('Storage error'));

      await expect(storageSettings.setDefaultIconColor('#ff0000')).rejects.toThrow('Storage error');
      expect(storageSettings.getDefaultIconColor()).toBe('#0a77e5');
    });

    it('should use default color when not set', () => {
      expect(storageSettings.getDefaultIconColor()).toBe('#0a77e5');
    });
  });
});
