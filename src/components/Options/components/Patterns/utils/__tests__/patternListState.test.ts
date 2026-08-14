import {describe, expect, it, vi} from 'vitest';

import {ProxyPattern, ProxyPatternType} from '../../../../../../tools/index';
import {
  addPattern,
  clonePattern,
  copyPattern,
  initializePatterns,
  movePattern,
  removePattern,
  updatePattern,
} from '../patternListState';

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

  it('updates a row without mutating the source', () => {
    const source = [{...pattern, id: 'one'}];
    const result = updatePattern(source, 'one', {name: 'Changed'});

    expect(result[0].name).toBe('Changed');
    expect(source[0].name).toBe('Example');
  });

  it('adds, copies, moves, and removes rows immutably', () => {
    const first = addPattern([], {name: 'First'}, () => 'one');
    const second = addPattern(first, {name: 'Second'}, () => 'two');
    const copied = copyPattern(second, 'one', () => 'copy');
    const moved = movePattern(copied, 'two', -1);
    const removed = removePattern(moved, 'copy');

    expect(first.map(({id}) => id)).toEqual(['one']);
    expect(copied.map(({id}) => id)).toEqual(['one', 'copy', 'two']);
    expect(moved.map(({id}) => id)).toEqual(['one', 'two', 'copy']);
    expect(removed.map(({id}) => id)).toEqual(['one', 'two']);
  });
});
