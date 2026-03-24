/**
 * Storage Settings Manager
 * Manages the storage type preference and persistence
 */
export enum StorageType {
  SYNC = 'sync',
  LOCAL = 'local',
  ENDPOINT = 'endpoint',
}

const STORAGE_TYPE_KEY = 'storageType';
const DEFAULT_ICON_COLOR_KEY = 'defaultIconColor';

export class StorageSettings {
  private static instance: StorageSettings;

  private storageType: StorageType = StorageType.SYNC; // Default to sync for backward compatibility
  private endpointUrl: string = '';
  private defaultIconColor: string = '#0a77e5'; // Default to the current PAC script color

  /**
   * Get the singleton instance
   */
  public static getInstance(): StorageSettings {
    if (!StorageSettings.instance) {
      StorageSettings.instance = new StorageSettings();
    }
    return StorageSettings.instance;
  }

  /**
   * Initialize the storage settings by loading the preferred storage type
   */
  async initialize(): Promise<void> {
    try {
      const result = await chrome.storage.local.get([STORAGE_TYPE_KEY, DEFAULT_ICON_COLOR_KEY]);
      if (result[STORAGE_TYPE_KEY]) {
        this.storageType = result[STORAGE_TYPE_KEY] as StorageType;
      }
      if (result[DEFAULT_ICON_COLOR_KEY]) {
        this.defaultIconColor = result[DEFAULT_ICON_COLOR_KEY] as string;
      }
    } catch (error) {
      console.warn('Failed to load storage preferences, using defaults:', error);
    }
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
    this.storageType = storageType;
    try {
      await chrome.storage.local.set({[STORAGE_TYPE_KEY]: storageType});
    } catch (error) {
      console.error('Failed to save storage type preference:', error);
      throw error;
    }
  }

  /**
   * Check if sync storage is currently selected
   */
  isSyncStorage(): boolean {
    return this.storageType === StorageType.SYNC;
  }

  /**
   * Check if local storage is currently selected
   */
  isLocalStorage(): boolean {
    return this.storageType === StorageType.LOCAL;
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
    this.defaultIconColor = color;
    try {
      await chrome.storage.local.set({[DEFAULT_ICON_COLOR_KEY]: color});
    } catch (error) {
      console.error('Failed to save default icon color preference:', error);
      throw error;
    }
  }
}
