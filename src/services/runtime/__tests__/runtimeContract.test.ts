import {describe, expect, it} from 'vitest';

import {RuntimeAction, parseBackgroundRequest} from '../runtimeContract';

describe('runtime contract', () => {
  it('accepts a typed proxy selection request', () => {
    expect(
      parseBackgroundRequest({action: RuntimeAction.SetProxy, mode: 'fixed_servers', id: 'office'}),
    ).toEqual({action: RuntimeAction.SetProxy, mode: 'fixed_servers', id: 'office'});
  });

  it('rejects unknown modes and malformed ids', () => {
    expect(parseBackgroundRequest({action: RuntimeAction.SetProxy, mode: 'broken'})).toBeNull();
    expect(
      parseBackgroundRequest({action: RuntimeAction.SetProxy, mode: 'system', id: 42}),
    ).toBeNull();
  });

  it('validates config commands at the background boundary', () => {
    expect(
      parseBackgroundRequest({
        action: RuntimeAction.MoveProxy,
        proxyId: 'office',
        offset: 2,
      }),
    ).toBeNull();
    expect(
      parseBackgroundRequest({
        action: RuntimeAction.SaveProxy,
        proxy: {id: 'broken'},
        isNew: true,
      }),
    ).toBeNull();
    expect(
      parseBackgroundRequest({
        action: RuntimeAction.SwitchStorage,
        storageType: 'endpoint',
      }),
    ).toBeNull();
  });
});
