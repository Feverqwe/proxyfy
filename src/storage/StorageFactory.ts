/**
 * Storage Factory
 * Creates and manages storage service instances based on settings
 */
import {StorageType} from './StorageSettings';

import {LocalStorageService, StorageService, StorageSettings, SyncStorageService} from './index';

export class StorageFactory {
  private static instance: StorageFactory;

  /**
   * Get the singleton instance
   */
  static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
  }

  private storageSettings: StorageSettings;

  private currentStorageService: StorageService | null = null;

  private currentStorageType: StorageType | null = null;

  private constructor() {
    this.storageSettings = StorageSettings.getInstance();
  }

  /**
   * Initialize the factory (should be called before first use)
   */
  async initialize(): Promise<void> {
    await this.storageSettings.initialize();
  }

  /**
   * Get the current storage service based on settings
   */
  getStorageService(): StorageService {
    const storageType = this.storageSettings.getStorageType();
    if (!this.currentStorageService || this.currentStorageType !== storageType) {
      this.currentStorageService = this.createStorageService();
      this.currentStorageType = storageType;
    }
    return this.currentStorageService;
  }

  /**
   * Switch to a different storage type and recreate the service
   */
  async switchStorageType(storageType: StorageType): Promise<void> {
    await this.storageSettings.setStorageType(storageType);
    this.currentStorageService = this.createStorageService();
    this.currentStorageType = storageType;
  }

  /**
   * Get the current storage type
   */
  getCurrentStorageType(): StorageType {
    return this.storageSettings.getStorageType();
  }

  /**
   * Create a specific storage service (bypassing settings)
   */
  createSpecificStorageService(storageType: StorageType): StorageService {
    switch (storageType) {
      case StorageType.SYNC:
        return new SyncStorageService();
      case StorageType.LOCAL:
        return new LocalStorageService();
      default:
        throw new Error(`Unknown storage type: ${storageType}`);
    }
  }

  /**
   * Create a storage service instance based on current settings
   */
  private createStorageService(): StorageService {
    const storageType = this.storageSettings.getStorageType();

    switch (storageType) {
      case StorageType.SYNC:
        return new SyncStorageService();
      case StorageType.LOCAL:
        return new LocalStorageService();
      default:
        console.warn(`Unknown storage type: ${storageType}, falling back to sync storage`);
        return new SyncStorageService();
    }
  }
}
