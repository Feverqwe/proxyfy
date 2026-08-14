import {describe, expect, it, vi} from 'vitest';

import {ProxyPattern, ProxyPatternType} from '../../../../../../tools/index';
import {clonePattern, initializePatterns} from '../patternListState';

const pattern: ProxyPattern = {
  enabled: true,
  name: 'Example',
  type: ProxyPatternType.Wildcard,
  pattern: '*.example.com',
};

describe('pattern list state', () => {
  it('adds stable IDs while preserving existing IDs', () => {
    const createId = vi.fn().mockReturnValue('generated');
    const patterns = initializePatterns([pattern, {...pattern, id: 'existing'}], createId);

    expect(patterns.map(({id}) => id)).toEqual(['generated', 'existing']);
    expect(createId).toHaveBeenCalledTimes(1);
  });

  it('gives copied rows a new ID', () => {
    const clone = clonePattern({...pattern, id: 'original'}, () => 'copy');

    expect(clone).toEqual({...pattern, id: 'copy'});
  });
});
