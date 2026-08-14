import {describe, expect, it} from 'vitest';

import {parseRgbaColor} from '../uiStateService';

describe('parseRgbaColor', () => {
  it('converts fractional alpha to a Chrome color tuple', () => {
    expect(parseRgbaColor('rgba(96, 125, 139, 0.5)')).toEqual([96, 125, 139, 128]);
  });

  it('rejects invalid channel and alpha values', () => {
    expect(parseRgbaColor('rgba(256,0,0,1)')).toBeNull();
    expect(parseRgbaColor('rgba(0,0,0,1.1)')).toBeNull();
  });
});
