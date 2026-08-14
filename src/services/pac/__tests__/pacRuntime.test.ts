import {describe, expect, it} from 'vitest';

import {DirectProxyType, GenericProxyType, ProxyPatternType} from '../../../tools/index';
import {createFindProxyForURL} from '../pacRuntime';
import {PacScript} from '../pacTypes';

describe('createFindProxyForURL', () => {
  it('uses the first matching valid rule and respects exclusions', () => {
    const config: PacScript = {
      rules: [
        {
          type: GenericProxyType.Http,
          host: 'proxy.example.com',
          port: 8080,
          whitePatterns: [{type: ProxyPatternType.Wildcard, pattern: '*'}],
          blackPatterns: [{type: ProxyPatternType.Wildcard, pattern: '*.internal.test'}],
        },
        {
          type: DirectProxyType.Direct,
          whitePatterns: [{type: ProxyPatternType.Wildcard, pattern: '*'}],
          blackPatterns: [],
        },
      ],
    };

    const findProxyForURL = createFindProxyForURL(config);

    expect(findProxyForURL('https://public.test/path')).toBe('PROXY proxy.example.com:8080');
    expect(findProxyForURL('https://host.internal.test/path')).toBe('DIRECT');
  });

  it('ignores an invalid rule instead of breaking the PAC runtime', () => {
    const config: PacScript = {
      rules: [
        {
          type: GenericProxyType.Http,
          host: 'proxy.example.com',
          port: 8080,
          whitePatterns: [{type: ProxyPatternType.Regexp, pattern: '('}],
          blackPatterns: [],
        },
      ],
    };

    expect(() => createFindProxyForURL(config)).not.toThrow();
    expect(createFindProxyForURL(config)('https://example.com')).toBe('DIRECT');
  });
});
