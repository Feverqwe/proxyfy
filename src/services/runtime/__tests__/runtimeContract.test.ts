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
});
