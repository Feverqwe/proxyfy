/**
 * Tests for getConfig function
 */
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {ConfigRepositoryError} from '../../storage/ConfigRepository';
import {StorageFactory} from '../../storage/StorageFactory';
import {StorageService} from '../../storage/StorageService';
import {StorageSettings, StorageType} from '../../storage/StorageSettings';
import {parseStoredConfig} from '../ConfigSchema';
import getConfig from '../getConfig';

describe('getConfig', () => {
  let storageFactory: StorageFactory;
  let storageSettings: StorageSettings;

  beforeEach(() => {
    // Reset singleton instances
    (StorageFactory as any).instance = undefined;
    (StorageSettings as any).instance = undefined;

    storageFactory = StorageFactory.getInstance();
    storageSettings = StorageSettings.getInstance();

    // Clear all mocks
    vi.clearAllMocks();
    vi.mocked(chrome.storage.local.get).mockResolvedValue({});
  });

  it('should initialize storage factory and get config from storage service', async () => {
    // Mock storage service get method to return empty object
    const mockGet = vi.fn().mockResolvedValue({});
    const mockStorageService: StorageService = {
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
    };

    // Mock storage factory to return our mock service
    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService);

    const config = await getConfig();

    // Verify storage factory was initialized
    expect(storageFactory.getStorageService).toHaveBeenCalled();

    // Verify storage service get was called
    expect(mockGet).toHaveBeenCalled();

    // Verify config is created from empty storage
    expect(config).toEqual(parseStoredConfig({}));
  });

  it('should handle storage with existing config data', async () => {
    const mockStorageData = {
      proxies: [
        {
          id: '1',
          enabled: true,
          title: 'Test Proxy',
          color: '#66cc66',
          type: 'http',
          host: 'localhost',
          port: 8080,
          whitePatterns: [],
          blackPatterns: [],
        },
      ],
    };

    const mockGet = vi.fn().mockResolvedValue(mockStorageData);
    const mockStorageService: StorageService = {
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
    };

    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService);

    const config = await getConfig();

    expect(mockGet).toHaveBeenCalled();
    expect(config.proxies).toEqual(mockStorageData.proxies);
  });

  it('should report invalid stored configuration without replacing it', async () => {
    const invalidStorageData = {
      proxies: 'invalid', // Should be an array
      patterns: 123, // Should be an array
    };

    const mockGet = vi.fn().mockResolvedValue(invalidStorageData);
    const mockStorageService: StorageService = {
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
    };

    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService);

    await expect(getConfig()).rejects.toMatchObject<Partial<ConfigRepositoryError>>({
      code: 'corrupt',
    });
    expect(mockGet).toHaveBeenCalled();
  });

  it('should work with different storage types', async () => {
    // Test with sync storage
    await storageSettings.setStorageType(StorageType.SYNC);

    const mockGet = vi.fn().mockResolvedValue({});
    const mockStorageService: StorageService = {
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
    };

    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService);

    const config = await getConfig();

    expect(mockGet).toHaveBeenCalled();
    expect(config).toEqual(parseStoredConfig({}));

    // Test with local storage
    await storageSettings.setStorageType(StorageType.LOCAL);

    const mockGet2 = vi.fn().mockResolvedValue({});
    const mockStorageService2: StorageService = {
      get: mockGet2,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
    };

    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService2);

    const config2 = await getConfig();

    expect(mockGet2).toHaveBeenCalled();
    expect(config2).toEqual(parseStoredConfig({}));
  });
});
