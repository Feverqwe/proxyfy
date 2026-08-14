/**
 * Storage Service Interface
 * Defines a unified interface for storage operations
 */
import type {StorageGetResult, StorageKeys, StorageSetItems} from '../types/storage';

export interface StorageService {
  /**
   * Gets one or more items from storage
   */
  get(keys?: StorageKeys): Promise<StorageGetResult>;

  /**
   * Sets one or more items in storage
   */
  set(items: StorageSetItems): Promise<void>;

  /**
   * Removes one or more items from storage
   */
  remove(keys: string | string[]): Promise<void>;
}
