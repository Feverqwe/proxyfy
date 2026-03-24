/**
 * Storage Utilities
 * Provides type-safe conversions between application types and storage types
 */

import type {Config} from './ConfigStruct';
import {DirectProxyType, GenericProxyType} from './ConfigStruct';
import type {StorageSetItems} from '../types/storage';

/**
 * Converts a Config object to a storage-compatible object
 */
export function configToStorageItems(config: Config): StorageSetItems {
  return {
    config: config
  };
}

/**
 * Extracts a Config object from storage items
 */
export function storageItemsToConfig(items: Record<string, unknown>): Config | null {
  const config = items.config;
  if (config && typeof config === 'object' && config !== null) {
    // Convert string enum values to proper enum types
    const convertedConfig = convertStringEnumsToEnumTypes(config);
    return convertedConfig as Config;
  }
  return null;
}

/**
 * Converts string enum values to proper enum types in a config object
 */
function convertStringEnumsToEnumTypes(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(item => convertStringEnumsToEnumTypes(item));
  } else if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'type' && typeof value === 'string') {
        // Convert proxy type strings to enum values
        if (Object.values(GenericProxyType).includes(value as GenericProxyType)) {
          result[key] = value as GenericProxyType;
        } else if (Object.values(DirectProxyType).includes(value as DirectProxyType)) {
          result[key] = value as DirectProxyType;
        } else {
          result[key] = value;
        }
      } else {
        result[key] = convertStringEnumsToEnumTypes(value);
      }
    }
    return result;
  }
  return obj;
}

/**
 * Type guard to check if a value is a valid Config object
 */
export function isValidConfig(value: unknown): value is Config {
  return (
    typeof value === 'object' &&
    value !== null &&
    'proxies' in value &&
    Array.isArray((value as Config).proxies)
  );
}
