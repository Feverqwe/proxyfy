/**
 * Tests for Storage Service Interface and Implementations
 */
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {LocalStorageService} from '../LocalStorageService';
import {StorageFactory} from '../StorageFactory';
import {StorageService} from '../StorageService';
import {StorageSettings, StorageType} from '../StorageSettings';
import {SyncStorageService} from '../SyncStorageService';

describe('StorageService Interface', () => {
  describe('SyncStorageService', () => {
    let service: StorageService;

    beforeEach(() => {
      service = new SyncStorageService();
    });

    it('should implement StorageService interface', () => {
      expect(service).toHaveProperty('get');
      expect(service).toHaveProperty('set');
      expect(service).toHaveProperty('remove');
    });

    it('should have correct method signatures', () => {
      expect(typeof service.get).toBe('function');
      expect(typeof service.set).toBe('function');
      expect(typeof service.remove).toBe('function');
    });
  });

  describe('LocalStorageService', () => {
    let service: StorageService;

    beforeEach(() => {
      service = new LocalStorageService();
    });

    it('should implement StorageService interface', () => {
      expect(service).toHaveProperty('get');
      expect(service).toHaveProperty('set');
      expect(service).toHaveProperty('remove');
    });

    it('should have correct method signatures', () => {
      expect(typeof service.get).toBe('function');
      expect(typeof service.set).toBe('function');
      expect(typeof service.remove).toBe('function');
    });
  });
});

describe('StorageSettings', () => {
  let settings: StorageSettings;

  beforeEach(() => {
    // Reset singleton instance
    (StorageSettings as any).instance = undefined;
    settings = StorageSettings.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = StorageSettings.getInstance();
    const instance2 = StorageSettings.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should have default storage type as SYNC', () => {
    expect(settings.getStorageType()).toBe(StorageType.SYNC);
  });

  it('should allow setting and getting storage type', async () => {
    await settings.setStorageType(StorageType.LOCAL);
    expect(settings.getStorageType()).toBe(StorageType.LOCAL);
  });
});

describe('StorageFactory', () => {
  let factory: StorageFactory;

  beforeEach(() => {
    // Reset singleton instances
    (StorageFactory as any).instance = undefined;
    (StorageSettings as any).instance = undefined;
    factory = StorageFactory.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = StorageFactory.getInstance();
    const instance2 = StorageFactory.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should create storage service based on settings', () => {
    const service = factory.getStorageService();
    expect(service).toBeDefined();
  });

  it('should recreate a cached service when storage type changes', async () => {
    const syncService = factory.getStorageService();

    await StorageSettings.getInstance().setStorageType(StorageType.LOCAL);
    const localService = factory.getStorageService();

    expect(syncService).toBeInstanceOf(SyncStorageService);
    expect(localService).toBeInstanceOf(LocalStorageService);
    expect(localService).not.toBe(syncService);
  });

  it('should allow switching storage types', async () => {
    vi.mocked(chrome.storage.sync.get).mockResolvedValue({});
    vi.mocked(chrome.storage.local.get).mockResolvedValue({});

    await factory.switchStorageType(StorageType.LOCAL);
    expect(factory.getCurrentStorageType()).toBe(StorageType.LOCAL);

    await factory.switchStorageType(StorageType.SYNC);
    expect(factory.getCurrentStorageType()).toBe(StorageType.SYNC);
  });
});
