/**
 * Local Storage Service Implementation
 * Wrapper around chrome.storage.local
 */
import type {StorageKeys, StorageSetItems} from '../types/storage';

import {StorageService} from './StorageService';

export class LocalStorageService implements StorageService {
  /**
   * Gets one or more items from chrome.storage.local
   */
  async get(keys?: StorageKeys): Promise<Record<string, unknown>> {
    return chrome.storage.local.get(keys);
  }

  /**
   * Sets one or more items in chrome.storage.local
   */
  async set(items: StorageSetItems): Promise<void> {
    await chrome.storage.local.set(items as Record<string, unknown>);
  }

  /**
   * Removes one or more items from chrome.storage.local
   */
  async remove(keys: string | string[]): Promise<void> {
    await chrome.storage.local.remove(keys);
  }

  /**
   * Clears all items from chrome.storage.local
   */
  async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }

  /**
   * Gets the total number of bytes being used by chrome.storage.local
   */
  async getBytesInUse(keys?: string | string[] | null): Promise<number> {
    return chrome.storage.local.getBytesInUse(keys);
  }
}
