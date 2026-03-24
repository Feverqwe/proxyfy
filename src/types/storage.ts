/**
 * Storage Layer Type Definitions
 * Provides type-safe interfaces for storage operations
 */

export type StorageKeys = string | string[] | Record<string, any> | null;

export type StorageGetResult = Record<string, any>;

export type StorageSetItems = Record<string, any>;
