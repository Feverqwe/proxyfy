import {describe, expect, it} from 'vitest';

import {getProxyDropOffset} from '../proxyListState';

const proxies = ['one', 'two', 'three', 'four'].map((id) => ({id}));

describe('proxy list state', () => {
  it('calculates one persisted move for drops in either direction', () => {
    expect(getProxyDropOffset(proxies, 'one', 'three', 'after')).toBe(2);
    expect(getProxyDropOffset(proxies, 'four', 'two', 'before')).toBe(-2);
    expect(getProxyDropOffset(proxies, 'two', 'three', 'before')).toBe(0);
  });

  it('ignores missing and same-row targets', () => {
    expect(getProxyDropOffset(proxies, 'missing', 'two', 'before')).toBe(0);
    expect(getProxyDropOffset(proxies, 'two', 'two', 'after')).toBe(0);
  });
});
