/**
 * Tests for getConfig function
 */
import {describe, it, expect, beforeEach, vi} from 'vitest';
import getConfig from '../getConfig';
import {StorageFactory} from '../../storage/StorageFactory';
import {StorageSettings, StorageType} from '../../storage/StorageSettings';
import {DefaultConfigStruct} from '../ConfigStruct';

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
  });

  it('should initialize storage factory and get config from storage service', async () => {
    // Mock storage service get method to return empty object
    const mockGet = vi.fn().mockResolvedValue({});
    const mockStorageService = {
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    // Mock storage factory to return our mock service
    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService as any);

    const config = await getConfig();

    // Verify storage factory was initialized
    expect(storageFactory.getStorageService).toHaveBeenCalled();

    // Verify storage service get was called
    expect(mockGet).toHaveBeenCalled();

    // Verify config is created from empty storage
    expect(config).toEqual(DefaultConfigStruct.create({}));
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
    const mockStorageService = {
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService as any);

    const config = await getConfig();

    expect(mockGet).toHaveBeenCalled();
    expect(config.proxies).toEqual(mockStorageData.proxies);
  });

  it('should handle validation errors and return default config', async () => {
    const invalidStorageData = {
      proxies: 'invalid', // Should be an array
      patterns: 123, // Should be an array
    };

    const mockGet = vi.fn().mockResolvedValue(invalidStorageData);
    const mockStorageService = {
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService as any);

    // Mock console.error to avoid test output noise
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

    const config = await getConfig();

    expect(mockGet).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(config).toEqual(DefaultConfigStruct.create({}));

    consoleErrorSpy.mockRestore();
  });

  it('should work with different storage types', async () => {
    // Test with sync storage
    await storageSettings.setStorageType(StorageType.SYNC);

    const mockGet = vi.fn().mockResolvedValue({});
    const mockStorageService = {
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService as any);

    const config = await getConfig();

    expect(mockGet).toHaveBeenCalled();
    expect(config).toEqual(DefaultConfigStruct.create({}));

    // Test with local storage
    await storageSettings.setStorageType(StorageType.LOCAL);

    const mockGet2 = vi.fn().mockResolvedValue({});
    const mockStorageService2 = {
      get: mockGet2,
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    vi.spyOn(storageFactory, 'getStorageService').mockReturnValue(mockStorageService2 as any);

    const config2 = await getConfig();

    expect(mockGet2).toHaveBeenCalled();
    expect(config2).toEqual(DefaultConfigStruct.create({}));
  });
});
