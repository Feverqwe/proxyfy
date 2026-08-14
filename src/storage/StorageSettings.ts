/**
 * Storage Settings Manager
 * Manages the storage type preference and persistence
 */
export enum StorageType {
  SYNC = 'sync',
  LOCAL = 'local',
}

const STORAGE_TYPE_KEY = 'storageType';
const DEFAULT_ICON_COLOR_KEY = 'defaultIconColor';

/**
 * Type guard to check if a value is a valid StorageType
 */
function isValidStorageType(value: unknown): value is StorageType {
  return typeof value === 'string' && Object.values(StorageType).includes(value as StorageType);
}

export class StorageSettings {
  private static instance: StorageSettings;

  /**
   * Get the singleton instance
   */
  static getInstance(): StorageSettings {
    if (!StorageSettings.instance) {
      StorageSettings.instance = new StorageSettings();
    }
    return StorageSettings.instance;
  }

  private storageType: StorageType = StorageType.SYNC; // Default to sync for backward compatibility
  private defaultIconColor = '#0a77e5'; // Default to the current PAC script color
  private initializePromise: Promise<void> | null = null;

  /**
   * Initialize the storage settings by loading the preferred storage type
   */
  initialize(): Promise<void> {
    if (!this.initializePromise) {
      this.initializePromise = this.load().catch((error) => {
        this.initializePromise = null;
        console.warn('Failed to load storage preferences, using defaults:', error);
      });
    }
    return this.initializePromise;
  }

  /**
   * Get the current storage type
   */
  getStorageType(): StorageType {
    return this.storageType;
  }

  /**
   * Set the storage type and persist it
   */
  async setStorageType(storageType: StorageType): Promise<void> {
    try {
      await chrome.storage.local.set({[STORAGE_TYPE_KEY]: storageType});
      this.storageType = storageType;
    } catch (error) {
      console.error('Failed to save storage type preference:', error);
      throw error;
    }
  }

  /**
   * Get the default icon color
   */
  getDefaultIconColor(): string {
    return this.defaultIconColor;
  }

  /**
   * Set the default icon color and persist it
   */
  async setDefaultIconColor(color: string): Promise<void> {
    try {
      await chrome.storage.local.set({[DEFAULT_ICON_COLOR_KEY]: color});
      this.defaultIconColor = color;
    } catch (error) {
      console.error('Failed to save default icon color preference:', error);
      throw error;
    }
  }

  private async load(): Promise<void> {
    const result = await chrome.storage.local.get([STORAGE_TYPE_KEY, DEFAULT_ICON_COLOR_KEY]);
    if (result[STORAGE_TYPE_KEY] && isValidStorageType(result[STORAGE_TYPE_KEY])) {
      this.storageType = result[STORAGE_TYPE_KEY];
    }
    if (typeof result[DEFAULT_ICON_COLOR_KEY] === 'string') {
      this.defaultIconColor = result[DEFAULT_ICON_COLOR_KEY];
    }
  }
}
