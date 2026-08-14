import {describe, expect, it} from 'vitest';

import type {Config} from '../../../tools/ConfigSchema';
import {
  cloneProxy,
  moveProxy,
  removeProxy,
  replaceProxyPatterns,
  setProxyEnabled,
} from '../configMutations';

const config: Config = {
  proxies: [
    {
      id: 'first',
      enabled: true,
      title: 'First',
      color: '#123456',
      type: 'direct',
      whitePatterns: [],
      blackPatterns: [],
    },
    {
      id: 'second',
      enabled: true,
      title: 'Second',
      color: '#654321',
      type: 'http',
      host: 'proxy.example.com',
      port: 8080,
      whitePatterns: [],
      blackPatterns: [],
    },
  ],
};

describe('proxy config mutations', () => {
  it('updates a proxy by id without mutating the input config', () => {
    const updated = setProxyEnabled(config, 'second', false);

    expect(updated.proxies[1].enabled).toBe(false);
    expect(config.proxies[1].enabled).toBe(true);
  });

  it('composes list mutations against the latest config', () => {
    const moved = moveProxy(config, 'second', -1);
    const cloned = cloneProxy(moved, 'second', 'clone');
    const removed = removeProxy(cloned, 'first');

    expect(removed.proxies.map(({id}) => id)).toEqual(['second', 'clone']);
  });

  it('copies nested patterns when cloning', () => {
    const withPatterns = replaceProxyPatterns(
      config,
      'second',
      [{enabled: true, name: 'All', type: 'wildcard', pattern: '*'}],
      [],
    );
    const cloned = cloneProxy(withPatterns, 'second', 'clone');

    expect(cloned.proxies[2].whitePatterns).toEqual(cloned.proxies[1].whitePatterns);
    expect(cloned.proxies[2].whitePatterns).not.toBe(cloned.proxies[1].whitePatterns);
  });

  it('fails instead of silently writing when a proxy is missing', () => {
    expect(() => removeProxy(config, 'missing')).toThrow('Proxy is not found: missing');
  });
});
