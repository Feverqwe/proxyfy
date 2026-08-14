/**
 * Storage Factory
 * Creates and manages storage service instances based on settings
 */
import {ConfigRepository} from './ConfigRepository';
import {LocalStorageService} from './LocalStorageService';
import {ProxyCredentialsRepository} from './ProxyCredentialsRepository';
import {SecureConfigRepository} from './SecureConfigRepository';
import type {StorageService} from './StorageService';
import {StorageSettings, StorageType} from './StorageSettings';
import {SyncStorageService} from './SyncStorageService';

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
      this.currentStorageService = this.createStorageService(storageType);
      this.currentStorageType = storageType;
    }
    return this.currentStorageService;
  }

  /**
   * Switch to a different storage type and recreate the service
   */
  async switchStorageType(storageType: StorageType): Promise<void> {
    const currentStorageType = this.storageSettings.getStorageType();
    if (currentStorageType === storageType) return;

    const sourceRepository = this.createConfigRepository(
      this.createStorageService(currentStorageType),
    );
    const targetRepository = this.createConfigRepository(this.createStorageService(storageType));
    const config = await sourceRepository.read();

    await targetRepository.write(config);
    const migratedConfig = await targetRepository.read();
    if (JSON.stringify(migratedConfig.proxies) !== JSON.stringify(config.proxies)) {
      throw new Error('Unable to verify migrated proxy configuration');
    }

    await this.storageSettings.setStorageType(storageType);
    this.currentStorageService = this.createStorageService(storageType);
    this.currentStorageType = storageType;
  }

  /**
   * Get the current storage type
   */
  getCurrentStorageType(): StorageType {
    return this.storageSettings.getStorageType();
  }

  getConfigRepository(): SecureConfigRepository {
    return this.createConfigRepository(this.getStorageService());
  }

  private createConfigRepository(storageService: StorageService): SecureConfigRepository {
    return new SecureConfigRepository(
      new ConfigRepository(storageService),
      new ProxyCredentialsRepository(new LocalStorageService()),
    );
  }

  private createStorageService(storageType: StorageType): StorageService {
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
