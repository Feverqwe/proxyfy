/**
 * Storage Layer Type Definitions
 * Provides type-safe interfaces for storage operations
 */

export type StorageKeys = string | string[] | Record<string, unknown> | null;

export type StorageGetResult = Record<string, unknown>;

export type StorageSetItems = object;
