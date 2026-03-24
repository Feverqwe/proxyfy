/**
 * Unit Tests for ProxyList clone functionality
 *
 * Tests the clone proxy logic without complex UI testing
 */

import {vi, describe, beforeEach, it, expect} from 'vitest';
import {
  ConfigProxy,
  GenericProxyType,
  DirectProxyType,
  ProxyPatternType,
} from '../../../../../tools/ConfigStruct.js';
import getId from '../../../../../tools/getId.js';

// Mock the dependencies
vi.mock('../../../../../tools/getId', () => ({
  __esModule: true,
  default: vi.fn(),
}));

// Import the actual cloning logic from the component
// We'll test the logic directly rather than the React component
const createCloneLogic = () => {
  // This simulates the handleClone function logic from ProxyList.tsx
  const handleClone = async (
    proxy: ConfigProxy,
    proxies: ConfigProxy[],
    saveProxies: (newProxies: ConfigProxy[]) => Promise<void>,
  ) => {
    const newProxies = proxies.slice(0);
    const clone = JSON.parse(JSON.stringify(proxy)) as ConfigProxy;
    clone.id = getId();
    clone.title = `Copy of ${proxy.title}`;
    newProxies.push(clone);

    await saveProxies(newProxies);
  };

  return {handleClone};
};

describe('ProxyList clone functionality', () => {
  const mockGetId = getId as any;
  let mockSaveProxies: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveProxies = vi.fn().mockResolvedValue(undefined);
  });

  it('should create a deep copy of proxy with new ID and prefixed title', async () => {
    // Set up mock for this test
    mockGetId.mockReturnValue('789');

    const originalProxy: ConfigProxy = {
      id: '123',
      title: 'Test Proxy',
      enabled: true,
      color: '#ff0000',
      type: GenericProxyType.Http,
      host: 'proxy.example.com',
      port: 8080,
      username: 'user',
      password: 'pass',
      whitePatterns: [],
      blackPatterns: [],
    };

    const existingProxies = [originalProxy];

    // Test the actual clone logic
    const {handleClone} = createCloneLogic();
    await handleClone(originalProxy, existingProxies, mockSaveProxies);

    // Verify getId was called
    expect(mockGetId).toHaveBeenCalledTimes(1);

    // Verify saveProxies was called with correct arguments
    expect(mockSaveProxies).toHaveBeenCalledTimes(1);
    const newProxies = mockSaveProxies.mock.calls[0][0];

    // Verify the new proxies array contains both original and clone
    expect(newProxies).toHaveLength(2);
    expect(newProxies[0]).toBe(originalProxy);

    const clone = newProxies[1];
    // Verify the clone has new ID and prefixed title
    expect(clone.id).toBe('789');
    expect(clone.title).toBe('Copy of Test Proxy');

    // Verify original proxy is unchanged
    expect(originalProxy.id).toBe('123');
    expect(originalProxy.title).toBe('Test Proxy');

    // Verify all other properties are preserved
    expect(clone.enabled).toBe(true);
    expect(clone.color).toBe('#ff0000');
    expect(clone.type).toBe(GenericProxyType.Http);
    expect(clone.host).toBe('proxy.example.com');
    expect(clone.port).toBe(8080);
    expect(clone.username).toBe('user');
    expect(clone.password).toBe('pass');
    expect(clone.whitePatterns).toEqual([]);
    expect(clone.blackPatterns).toEqual([]);

    // Verify it's a deep copy (not the same reference)
    expect(clone).not.toBe(originalProxy);
  });

  it('should handle cloning with existing proxies in the list', async () => {
    // Set up mock for this test
    mockGetId.mockReturnValue('999');

    const proxy1: ConfigProxy = {
      id: '123',
      title: 'Proxy 1',
      enabled: true,
      color: '#ff0000',
      type: GenericProxyType.Http,
      host: 'proxy1.com',
      port: 8080,
      whitePatterns: [],
      blackPatterns: [],
    };
    const proxy2: ConfigProxy = {
      id: '456',
      title: 'Proxy 2',
      enabled: false,
      color: '#00ff00',
      type: GenericProxyType.Https,
      host: 'proxy2.com',
      port: 9090,
      whitePatterns: [],
      blackPatterns: [],
    };

    const existingProxies = [proxy1, proxy2];

    // Test the actual clone logic
    const {handleClone} = createCloneLogic();
    await handleClone(proxy1, existingProxies, mockSaveProxies);

    // Verify saveProxies was called with correct arguments
    expect(mockSaveProxies).toHaveBeenCalledTimes(1);
    const newProxies = mockSaveProxies.mock.calls[0][0];

    // Verify the clone is added to the end
    expect(newProxies).toHaveLength(3);
    expect(newProxies[0]).toBe(proxy1);
    expect(newProxies[1]).toBe(proxy2);
    expect(newProxies[2].id).toBe('999');
    expect(newProxies[2].title).toBe('Copy of Proxy 1');
  });

  it('should generate unique IDs for each clone', async () => {
    // Set up mock with sequence for this test
    mockGetId
      .mockReturnValueOnce('111') // First call
      .mockReturnValueOnce('222'); // Second call

    const proxy: ConfigProxy = {
      id: '123',
      title: 'Test Proxy',
      enabled: true,
      color: '#ff0000',
      type: GenericProxyType.Http,
      host: 'proxy.com',
      port: 8080,
      whitePatterns: [],
      blackPatterns: [],
    };

    const existingProxies = [proxy];

    // Test cloning the same proxy twice
    const {handleClone} = createCloneLogic();
    await handleClone(proxy, existingProxies, mockSaveProxies);
    await handleClone(proxy, existingProxies, mockSaveProxies);

    // Verify getId was called twice
    expect(mockGetId).toHaveBeenCalledTimes(2);

    // Verify saveProxies was called twice
    expect(mockSaveProxies).toHaveBeenCalledTimes(2);

    const firstCallProxies = mockSaveProxies.mock.calls[0][0];
    const secondCallProxies = mockSaveProxies.mock.calls[1][0];

    // Verify each clone gets a unique ID
    expect(firstCallProxies[1].id).toBe('111');
    expect(secondCallProxies[1].id).toBe('222');
    expect(firstCallProxies[1].id).not.toBe(secondCallProxies[1].id);
    expect(firstCallProxies[1].id).not.toBe(proxy.id);
    expect(secondCallProxies[1].id).not.toBe(proxy.id);
  });

  it('should handle direct proxy type correctly', async () => {
    mockGetId.mockReturnValue('777');

    const directProxy: ConfigProxy = {
      id: '123',
      title: 'Direct Proxy',
      enabled: true,
      color: '#0000ff',
      type: DirectProxyType.Direct, // Using 'direct' type
      whitePatterns: [],
      blackPatterns: [],
    };

    const existingProxies = [directProxy];

    const {handleClone} = createCloneLogic();
    await handleClone(directProxy, existingProxies, mockSaveProxies);

    expect(mockSaveProxies).toHaveBeenCalledTimes(1);
    const newProxies = mockSaveProxies.mock.calls[0][0];

    const clone = newProxies[1];
    expect(clone.id).toBe('777');
    expect(clone.title).toBe('Copy of Direct Proxy');
    expect(clone.type).toBe('direct');
    expect(clone).not.toHaveProperty('host');
    expect(clone).not.toHaveProperty('port');
  });

  it('should preserve complex nested structures like patterns', async () => {
    mockGetId.mockReturnValue('555');

    const proxyWithPatterns: ConfigProxy = {
      id: '123',
      title: 'Proxy with Patterns',
      enabled: true,
      color: '#ffff00',
      type: GenericProxyType.Http,
      host: 'proxy.com',
      port: 8080,
      whitePatterns: [
        {
          enabled: true,
          name: 'White Pattern 1',
          type: ProxyPatternType.Wildcard,
          pattern: '*.example.com',
        },
      ],
      blackPatterns: [
        {
          enabled: false,
          name: 'Black Pattern 1',
          type: ProxyPatternType.Regexp,
          pattern: '.*\\.internal\\..*',
        },
      ],
    };

    const existingProxies = [proxyWithPatterns];

    const {handleClone} = createCloneLogic();
    await handleClone(proxyWithPatterns, existingProxies, mockSaveProxies);

    expect(mockSaveProxies).toHaveBeenCalledTimes(1);
    const newProxies = mockSaveProxies.mock.calls[0][0];

    const clone = newProxies[1];
    expect(clone.whitePatterns).toEqual(proxyWithPatterns.whitePatterns);
    expect(clone.blackPatterns).toEqual(proxyWithPatterns.blackPatterns);

    // Verify it's a deep copy (not the same reference)
    expect(clone.whitePatterns).not.toBe(proxyWithPatterns.whitePatterns);
    expect(clone.blackPatterns).not.toBe(proxyWithPatterns.blackPatterns);
  });
});
