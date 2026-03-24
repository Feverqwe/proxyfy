# Type-Safe Mocking Patterns for Tests

This directory contains type-safe mocking utilities that eliminate the need for `as any` assertions in tests, providing better type safety and maintainability.

## Overview

The mocking patterns include:

1. **Chrome API Mocks** - Type-safe mocks for Chrome extension APIs
2. **Storage Service Mocks** - Type-safe mocks for the storage layer
3. **Test Helpers** - Utility functions for common testing patterns
4. **Mock Data Generators** - Helper functions for generating realistic test data

## Usage Examples

### Chrome API Mocks

```typescript
import {createChromeMocks, setupChromeMocks} from './mocks/chromeMocks.js';

describe('My Test', () => {
  let chromeMocks;

  beforeEach(() => {
    chromeMocks = setupChromeMocks();
  });

  it('should use type-safe Chrome mocks', async () => {
    // Mock storage operations with proper typing
    const mockSet = vi.spyOn(chromeMocks.storage.sync, 'set').mockResolvedValue();

    // Your test code here
    await someFunctionThatUsesChromeStorage();

    // Type-safe assertions
    expect(mockSet).toHaveBeenCalledWith({key: 'value'});
  });
});
```

### Storage Service Mocks

```typescript
import {createMockStorageService, createMockStorageFactory} from './mocks/storageMocks.js';

describe('Storage Tests', () => {
  let mockService;
  let mockFactory;

  beforeEach(() => {
    mockService = createMockStorageService();
    mockFactory = createMockStorageFactory();
  });

  it('should use type-safe storage mocks', async () => {
    // Set up mock data
    await mockService.set({proxies: [{id: '1', type: 'http'}]});

    // Test retrieval
    const result = await mockService.get('proxies');
    expect(result.proxies).toHaveLength(1);
  });
});
```

### Mock Data Generators

```typescript
import {MockDataGenerators} from './mocks/storageMocks.js';

const proxyConfig = MockDataGenerators.createProxyConfig({
  title: 'Test Proxy',
  host: 'proxy.example.com',
  port: 8080,
});

const storageData = MockDataGenerators.createStorageData({
  proxies: [proxyConfig],
  storageType: StorageType.LOCAL,
});
```

## Benefits

1. **Type Safety**: No more `as any` assertions - all mocks are properly typed
2. **Better IDE Support**: Full TypeScript IntelliSense and autocomplete
3. **Runtime Safety**: Type errors are caught at compile time, not runtime
4. **Maintainability**: Clear type definitions make the code easier to understand and modify
5. **Test Reliability**: Type-safe mocks reduce the risk of test failures due to type mismatches

## Migration Guide

### Before (Unsafe)

```typescript
// Old pattern with unsafe type assertions
(chrome.storage.sync.set as any) = vi.fn().mockResolvedValue(undefined);
(chrome.storage.sync.get as any) = vi.fn().mockResolvedValue({data: 'value'});
```

### After (Type-Safe)

```typescript
// New pattern with type-safe mocks
const mockSet = vi.spyOn(chromeMocks.storage.sync, 'set').mockResolvedValue(undefined);
const mockGet = vi.spyOn(chromeMocks.storage.sync, 'get').mockResolvedValue({data: 'value'});
```

## Files

- `chromeMocks.ts` - Chrome extension API mocks
- `storageMocks.ts` - Storage service layer mocks
- `testHelpers.ts` - General testing utilities
- `mockingPatterns.unit.test.ts` - Demonstration and verification of mocking patterns
- `index.ts` - Barrel file for easy imports

## Testing the Mocks

The `mockingPatterns.unit.test.ts` file contains comprehensive tests that verify the mocking utilities work correctly and demonstrate their usage patterns.
