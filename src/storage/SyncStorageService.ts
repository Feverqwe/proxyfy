/**
 * Sync Storage Service Implementation
 * Wrapper around chrome.storage.sync
 */
import {StorageService} from './StorageService';

export class SyncStorageService implements StorageService {
  /**
   * Gets one or more items from chrome.storage.sync
   */
  async get(keys?: string | string[] | Record<string, any> | null): Promise<Record<string, any>> {
    return chrome.storage.sync.get(keys);
  }

  /**
   * Sets one or more items in chrome.storage.sync
   */
  async set(items: Record<string, any>): Promise<void> {
    await chrome.storage.sync.set(items);
  }

  /**
   * Removes one or more items from chrome.storage.sync
   */
  async remove(keys: string | string[]): Promise<void> {
    await chrome.storage.sync.remove(keys);
  }

  /**
   * Clears all items from chrome.storage.sync
   */
  async clear(): Promise<void> {
    await chrome.storage.sync.clear();
  }

  /**
   * Gets the total number of bytes being used by chrome.storage.sync
   */
  async getBytesInUse(keys?: string | string[] | null): Promise<number> {
    return chrome.storage.sync.getBytesInUse(keys);
  }
}
