import {describe, expect, it} from 'vitest';

import {createDefaultProxy, parseConfig, parseStoredConfig} from '../ConfigSchema';
import {DirectProxyType, GenericProxyType} from '../ProxyTypes';

describe('ConfigSchema', () => {
  it('creates an empty configuration for empty storage', () => {
    expect(parseStoredConfig({})).toEqual({proxies: []});
  });

  it('preserves unrelated root storage values', () => {
    expect(parseConfig({proxies: [], storageType: 'local'})).toEqual({
      proxies: [],
      storageType: 'local',
    });
  });

  it('creates a default generic proxy', () => {
    expect(createDefaultProxy({color: '#123456'})).toEqual({
      id: '',
      enabled: true,
      title: '',
      color: '#123456',
      badgeText: '',
      badgeColor: 'rgba(96,125,139,1)',
      type: GenericProxyType.Http,
      host: '',
      port: 3128,
      whitePatterns: [],
      blackPatterns: [],
    });
  });

  it('parses a direct proxy without generic proxy fields', () => {
    expect(
      createDefaultProxy({
        type: DirectProxyType.Direct,
        title: 'Direct',
      }),
    ).toEqual({
      id: '',
      enabled: true,
      title: 'Direct',
      color: '#66cc66',
      badgeText: '',
      badgeColor: 'rgba(96,125,139,1)',
      type: DirectProxyType.Direct,
      whitePatterns: [],
      blackPatterns: [],
    });
  });

  it('rejects invalid nested proxy data', () => {
    expect(() =>
      parseConfig({
        proxies: [
          {
            id: 'proxy-1',
            enabled: true,
            title: 'Proxy',
            color: '#66cc66',
            type: GenericProxyType.Http,
            host: 'proxy.example.com',
            port: '8080',
            whitePatterns: [],
            blackPatterns: [],
          },
        ],
      }),
    ).toThrow();
  });
});
