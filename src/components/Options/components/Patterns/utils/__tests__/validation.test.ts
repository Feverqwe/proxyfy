import {describe, expect, it} from 'vitest';

import {ProxyPatternType} from '../../../../../../tools/index';
import {arePatternsValid} from '../validation';

describe('arePatternsValid', () => {
  it('rejects enabled invalid regular expressions', () => {
    expect(
      arePatternsValid([
        {
          enabled: true,
          name: 'invalid',
          type: ProxyPatternType.Regexp,
          pattern: '(',
        },
      ]),
    ).toBe(false);
  });

  it('allows disabled invalid regular expressions', () => {
    expect(
      arePatternsValid([
        {
          enabled: false,
          name: 'disabled',
          type: ProxyPatternType.Regexp,
          pattern: '(',
        },
      ]),
    ).toBe(true);
  });
});
