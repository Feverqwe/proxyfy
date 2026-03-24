/**
 * Storage Factory
 * Creates and manages storage service instances based on settings
 */
import {StorageService} from './StorageService';
import {SyncStorageService} from './SyncStorageService';
import {LocalStorageService} from './LocalStorageService';
import {StorageSettings, StorageType} from './StorageSettings';

export class StorageFactory {
  private static instance: StorageFactory;

  private storageSettings: StorageSettings;

  private currentStorageService: StorageService | null = null;

  private constructor() {
    this.storageSettings = StorageSettings.getInstance();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): StorageFactory {
    if (!StorageFactory.instance) {
      StorageFactory.instance = new StorageFactory();
    }
    return StorageFactory.instance;
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
    if (!this.currentStorageService) {
      this.currentStorageService = this.createStorageService();
    }
    return this.currentStorageService;
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

  /**
   * Switch to a different storage type and recreate the service
   */
  async switchStorageType(storageType: StorageType): Promise<void> {
    await this.storageSettings.setStorageType(storageType);
    this.currentStorageService = this.createStorageService();
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
}
