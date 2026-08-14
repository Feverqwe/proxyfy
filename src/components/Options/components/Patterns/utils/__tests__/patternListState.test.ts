import {describe, expect, it, vi} from 'vitest';

import {ProxyPattern, ProxyPatternType} from '../../../../../../tools/index';
import {
  addPattern,
  clonePattern,
  copyPattern,
  initializePatterns,
  placePattern,
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

  it('adds, copies, and removes rows immutably', () => {
    const first = addPattern([], {name: 'First'}, () => 'one');
    const second = addPattern(first, {name: 'Second'}, () => 'two');
    const copied = copyPattern(second, 'one', () => 'copy');
    const removed = removePattern(copied, 'copy');

    expect(first.map(({id}) => id)).toEqual(['one']);
    expect(copied.map(({id}) => id)).toEqual(['one', 'copy', 'two']);
    expect(removed.map(({id}) => id)).toEqual(['one', 'two']);
  });

  it('places a dragged row before or after its target without mutating the source', () => {
    const source = [
      {...pattern, id: 'one'},
      {...pattern, id: 'two'},
      {...pattern, id: 'three'},
      {...pattern, id: 'four'},
    ];

    const movedDown = placePattern(source, 'one', 'three', 'after');
    const movedUp = placePattern(source, 'four', 'two', 'before');

    expect(movedDown.map(({id}) => id)).toEqual(['two', 'three', 'one', 'four']);
    expect(movedUp.map(({id}) => id)).toEqual(['one', 'four', 'two', 'three']);
    expect(source.map(({id}) => id)).toEqual(['one', 'two', 'three', 'four']);
  });
});
