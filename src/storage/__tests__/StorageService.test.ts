/**
 * Tests for Storage Service Interface and Implementations
 */
import {beforeEach, describe, expect, it} from 'vitest';
import {StorageService} from '../StorageService.js';
import {SyncStorageService} from '../SyncStorageService.js';
import {LocalStorageService} from '../LocalStorageService.js';
import {StorageSettings, StorageType} from '../StorageSettings.js';
import {StorageFactory} from '../StorageFactory.js';

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
      expect(service).toHaveProperty('clear');
      expect(service).toHaveProperty('getBytesInUse');
    });

    it('should have correct method signatures', () => {
      expect(typeof service.get).toBe('function');
      expect(typeof service.set).toBe('function');
      expect(typeof service.remove).toBe('function');
      expect(typeof service.clear).toBe('function');
      expect(typeof service.getBytesInUse).toBe('function');
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
      expect(service).toHaveProperty('clear');
      expect(service).toHaveProperty('getBytesInUse');
    });

    it('should have correct method signatures', () => {
      expect(typeof service.get).toBe('function');
      expect(typeof service.set).toBe('function');
      expect(typeof service.remove).toBe('function');
      expect(typeof service.clear).toBe('function');
      expect(typeof service.getBytesInUse).toBe('function');
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

  it('should provide helper methods for storage type checking', () => {
    settings.setStorageType(StorageType.SYNC);
    expect(settings.isSyncStorage()).toBe(true);
    expect(settings.isLocalStorage()).toBe(false);

    settings.setStorageType(StorageType.LOCAL);
    expect(settings.isSyncStorage()).toBe(false);
    expect(settings.isLocalStorage()).toBe(true);
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

  it('should allow switching storage types', async () => {
    await factory.switchStorageType(StorageType.LOCAL);
    expect(factory.getCurrentStorageType()).toBe(StorageType.LOCAL);

    await factory.switchStorageType(StorageType.SYNC);
    expect(factory.getCurrentStorageType()).toBe(StorageType.SYNC);
  });

  it('should create specific storage services', () => {
    const syncService = factory.createSpecificStorageService(StorageType.SYNC);
    const localService = factory.createSpecificStorageService(StorageType.LOCAL);

    expect(syncService).toBeDefined();
    expect(localService).toBeDefined();
    expect(syncService).not.toBe(localService);
  });
});
