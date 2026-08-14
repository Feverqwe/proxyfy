/**
 * Unit tests for type-safe mocking patterns
 *
 * Demonstrates the usage of the new type-safe mocking utilities
 * and verifies they work correctly.
 */

import {beforeEach, describe, expect, it, vi} from 'vitest';

import {StorageType} from '../../storage/StorageSettings';

import {ChromeMocks, createChromeMocks, resetChromeMocks} from './chromeMocks';
import {
  MockDataGenerators,
  MockStorageFactory,
  MockStorageService,
  createMockStorageFactory,
  createMockStorageService,
} from './storageMocks';

describe('Type-Safe Mocking Patterns', () => {
  describe('Chrome Mocks', () => {
    let chromeMocks: ChromeMocks;

    beforeEach(() => {
      chromeMocks = createChromeMocks();
    });

    it('should create type-safe Chrome storage mocks', () => {
      expect(chromeMocks.storage.local).toBeDefined();
      expect(chromeMocks.storage.sync).toBeDefined();
      expect(chromeMocks.storage.local._data).toBeInstanceOf(Map);
      expect(chromeMocks.storage.sync._data).toBeInstanceOf(Map);
    });

    it('should store and retrieve data from Chrome storage mocks', async () => {
      const {local} = chromeMocks.storage;

      // Test set operation
      await local.set({key1: 'value1', key2: 123});

      // Test get operation with single key
      const result1 = await local.get('key1');
      expect(result1).toEqual({key1: 'value1'});

      // Test get operation with multiple keys
      const result2 = await local.get(['key1', 'key2']);
      expect(result2).toEqual({key1: 'value1', key2: 123});

      // Test get operation without keys (returns all)
      const result3 = await local.get();
      expect(result3).toEqual({key1: 'value1', key2: 123});
    });

    it('should handle storage errors in Chrome mocks', async () => {
      const mockSet = vi
        .spyOn(chromeMocks.storage.local, 'set')
        .mockRejectedValue(new Error('Storage error'));

      await expect(chromeMocks.storage.local.set({key: 'value'})).rejects.toThrow('Storage error');

      mockSet.mockRestore();
    });

    it('should reset Chrome mocks correctly', () => {
      // Add some data
      chromeMocks.storage.local._data.set('test', 'value');
      expect(chromeMocks.storage.local._data.size).toBe(1);

      // Reset
      resetChromeMocks(chromeMocks);

      // Verify data is cleared
      expect(chromeMocks.storage.local._data.size).toBe(0);
    });
  });

  describe('Storage Service Mocks', () => {
    let mockService: MockStorageService;

    beforeEach(() => {
      mockService = createMockStorageService();
    });

    it('should create type-safe storage service mock', () => {
      expect(mockService).toBeDefined();
      expect(mockService._data).toBeInstanceOf(Map);
      expect(typeof mockService.get).toBe('function');
      expect(typeof mockService.set).toBe('function');
      expect(typeof mockService.remove).toBe('function');
      expect(typeof mockService.clear).toBe('function');
      expect(typeof mockService.getBytesInUse).toBe('function');
    });

    it('should store and retrieve data from storage service mock', async () => {
      // Test set operation
      await mockService.set({proxyConfig: {type: 'http'}, patterns: ['*.example.com']});

      // Test get operation with single key
      const result1 = await mockService.get('proxyConfig');
      expect(result1).toEqual({proxyConfig: {type: 'http'}});

      // Test get operation with multiple keys
      const result2 = await mockService.get(['proxyConfig', 'patterns']);
      expect(result2).toEqual({proxyConfig: {type: 'http'}, patterns: ['*.example.com']});
    });

    it('should handle errors in storage service mock', async () => {
      mockService._setError(new Error('Mock error'));

      await expect(mockService.get('key')).rejects.toThrow('Mock error');
      await expect(mockService.set({key: 'value'})).rejects.toThrow('Mock error');

      mockService._clearError();

      // Should work again after clearing error
      await mockService.set({key: 'value'});
      const result = await mockService.get('key');
      expect(result).toEqual({key: 'value'});
    });
  });

  describe('Storage Factory Mocks', () => {
    let mockFactory: MockStorageFactory;

    beforeEach(() => {
      mockFactory = createMockStorageFactory(StorageType.SYNC);
    });

    it('should create type-safe storage factory mock', () => {
      expect(mockFactory).toBeDefined();
      expect(typeof mockFactory.getStorageService).toBe('function');
      expect(typeof mockFactory.switchStorageType).toBe('function');
      expect(typeof mockFactory.getCurrentStorageType).toBe('function');
      expect(typeof mockFactory.createSpecificStorageService).toBe('function');
    });

    it('should handle storage type switching', async () => {
      expect(mockFactory.getCurrentStorageType()).toBe(StorageType.SYNC);

      await mockFactory.switchStorageType(StorageType.LOCAL);
      expect(mockFactory.getCurrentStorageType()).toBe(StorageType.LOCAL);

      await mockFactory.switchStorageType(StorageType.SYNC);
      expect(mockFactory.getCurrentStorageType()).toBe(StorageType.SYNC);
    });

    it('should provide storage service', () => {
      const service = mockFactory.getStorageService();
      expect(service).toBeDefined();
      expect(typeof service.get).toBe('function');
      expect(typeof service.set).toBe('function');
    });
  });

  describe('Mock Data Generators', () => {
    it('should generate realistic proxy configuration data', () => {
      const proxyConfig = MockDataGenerators.createProxyConfig({
        title: 'Custom Proxy',
        host: 'custom.example.com',
        port: 9090,
      });

      expect(proxyConfig).toEqual({
        id: 'test-id',
        enabled: true,
        title: 'Custom Proxy',
        color: '#66cc66',
        type: 'http',
        host: 'custom.example.com',
        port: 9090,
        whitePatterns: [],
        blackPatterns: [],
      });
    });

    it('should generate realistic storage data', () => {
      const storageData = MockDataGenerators.createStorageData({
        proxies: [MockDataGenerators.createProxyConfig({title: 'Proxy 1'})],
        storageType: StorageType.LOCAL,
      });

      expect(storageData).toEqual({
        proxies: [
          {
            id: 'test-id',
            enabled: true,
            title: 'Proxy 1',
            color: '#66cc66',
            type: 'http',
            host: 'localhost',
            port: 8080,
            whitePatterns: [],
            blackPatterns: [],
          },
        ],
        storageType: StorageType.LOCAL,
      });
    });
  });
});
