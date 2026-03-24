/**
 * Type-safe test utilities and helpers
 *
 * Provides common testing patterns with proper TypeScript typing to eliminate
 * `as any` assertions and improve test maintainability.
 */

import {Mock, vi} from 'vitest';

/**
 * Type-safe mock factory for functions
 */
export function createMockFn<T extends (...args: any[]) => any>(): Mock<T> {
  return vi.fn() as Mock<T>;
}

/**
 * Type-safe partial mock that preserves the original type structure
 */
export function createPartialMock<T>(partial: Partial<T>): T {
  return partial as T;
}

/**
 * Type-safe spy that preserves the original function signature
 */
export function createTypeSafeSpy<T extends (...args: any[]) => any>(
  obj: any,
  method: keyof T,
): Mock<T> {
  return vi.spyOn(obj, method as string) as Mock<T>;
}

/**
 * Helper to wait for async operations to complete
 */
export function waitForAsync(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Helper to simulate async delay for testing timeouts
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Type guard for checking if a value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard for checking if a value is a specific type
 */
export function isType<T>(value: unknown, typeCheck: (val: unknown) => boolean): value is T {
  return typeCheck(value);
}

/**
 * Utility to create test fixtures with proper typing
 */
export class TestFixture<T> {
  private setupFn: () => T;
  private teardownFn?: (fixture: T) => void;

  constructor(setup: () => T, teardown?: (fixture: T) => void) {
    this.setupFn = setup;
    this.teardownFn = teardown;
  }

  async use<U>(testFn: (fixture: T) => U | Promise<U>): Promise<U> {
    const fixture = this.setupFn();
    try {
      return await testFn(fixture);
    } finally {
      if (this.teardownFn) {
        this.teardownFn(fixture);
      }
    }
  }
}

/**
 * Creates a test fixture for storage-related tests
 */
export function createStorageTestFixture() {
  return new TestFixture(
    () => ({
      // Setup logic for storage tests
      mockData: {},
      storageType: 'sync' as const,
    }),
    (fixture) => {
      // Teardown logic
      vi.clearAllMocks();
    },
  );
}

/**
 * Assertion helpers for common test patterns
 */
export const Assertions = {
  /**
   * Asserts that a function throws a specific error
   */
  async throwsAsync<T extends Error>(
    fn: () => Promise<any>,
    errorType?: new (...args: any[]) => T,
    message?: string,
  ): Promise<T> {
    try {
      await fn();
      throw new Error('Function did not throw');
    } catch (error) {
      if (errorType && !(error instanceof errorType)) {
        throw new Error(`Expected error of type ${errorType.name}, but got ${error?.constructor?.name}`);
      }
      if (message && error instanceof Error && error.message !== message) {
        throw new Error(`Expected error message "${message}", but got "${error.message}"`);
      }
      return error as T;
    }
  },

  /**
   * Asserts that an object has all required properties
   */
  hasProperties<T>(obj: unknown, properties: (keyof T)[]): obj is T {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    return properties.every(prop => prop in (obj as any));
  },
};

/**
 * Test configuration constants
 */
export const TestConfig = {
  TIMEOUT_SHORT: 100,
  TIMEOUT_MEDIUM: 500,
  TIMEOUT_LONG: 1000,

  // Common test data
  TEST_PROXY_CONFIG: {
    id: 'test-proxy',
    enabled: true,
    title: 'Test Proxy',
    color: '#66cc66',
    type: 'http',
    host: 'localhost',
    port: 8080,
    whitePatterns: [] as string[],
    blackPatterns: [] as string[],
  },

  TEST_STORAGE_DATA: {
    proxies: [
      {
        id: 'proxy-1',
        enabled: true,
        title: 'Proxy 1',
        color: '#66cc66',
        type: 'http',
        host: 'proxy1.example.com',
        port: 8080,
        whitePatterns: [],
        blackPatterns: [],
      },
    ],
    storageType: 'sync' as const,
  },
};
