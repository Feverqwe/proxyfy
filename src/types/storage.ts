/**
 * Storage Layer Type Definitions
 * Provides type-safe interfaces for storage operations
 */

export interface StorageKeyValuePair {
  key: string;
  value: unknown;
}

export type StorageKeys = string | string[] | Record<string, unknown> | null;

export interface StorageGetResult {
  [key: string]: unknown;
}

export interface StorageSetItems {
  [key: string]: unknown;
}

/**
 * Type guard to check if a value is a valid storage key
 */
export function isValidStorageKey(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a value is a valid storage keys array
 */
export function isValidStorageKeysArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isValidStorageKey);
}

/**
 * Type guard to check if a value is a valid storage keys object
 */
export function isValidStorageKeysObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a valid storage keys parameter
 */
export function isValidStorageKeys(value: unknown): value is StorageKeys {
  return value === null || 
         isValidStorageKey(value) || 
         isValidStorageKeysArray(value) || 
         isValidStorageKeysObject(value);
}

/**
 * Type guard to check if a value is a valid storage set items object
 */
export function isValidStorageSetItems(value: unknown): value is StorageSetItems {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}