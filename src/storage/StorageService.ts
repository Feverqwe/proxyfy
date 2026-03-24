/**
 * Storage Service Interface
 * Defines a unified interface for storage operations
 */
export interface StorageService {
  /**
   * Gets one or more items from storage
   */
  get(keys?: string | string[] | Record<string, any> | null): Promise<Record<string, any>>;

  /**
   * Sets one or more items in storage
   */
  set(items: Record<string, any>): Promise<void>;

  /**
   * Removes one or more items from storage
   */
  remove(keys: string | string[]): Promise<void>;

  /**
   * Clears all items from storage
   */
  clear(): Promise<void>;

  /**
   * Gets the total number of bytes being used by storage
   */
  getBytesInUse?(keys?: string | string[] | null): Promise<number>;
}
