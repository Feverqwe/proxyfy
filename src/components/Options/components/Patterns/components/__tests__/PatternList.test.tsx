import React, {act} from 'react';

import {ThemeProvider} from '@mui/material';
import {createRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ProxyPattern, ProxyPatternType} from '../../../../../../tools/index';
import theme from '../../../../../theme';
import {PatternList} from '../PatternList';

const patterns: ProxyPattern[] = ['one', 'two', 'three'].map((id) => ({
  id,
  enabled: true,
  name: id,
  pattern: `${id}.example.com`,
  type: ProxyPatternType.Wildcard,
}));

describe('PatternList', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('reorders rules when a drag handle is dropped after another row', async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <ThemeProvider theme={theme}>
          <PatternList patterns={patterns} onChange={onChange} />
        </ThemeProvider>,
      );
    });

    const handles = container.querySelectorAll<HTMLElement>('[title="Drag to reorder"]');
    const rows = container.querySelectorAll<HTMLElement>('.pattern-row');
    const dataTransfer = {
      dropEffect: 'none',
      effectAllowed: 'none',
      setData: vi.fn(),
      setDragImage: vi.fn(),
    };

    await act(async () => {
      dispatchDragEvent(handles[0], 'dragstart', dataTransfer, 0);
    });

    rows[1].getBoundingClientRect = () =>
      ({top: 0, bottom: 100, height: 100, left: 0, right: 100, width: 100, x: 0, y: 0}) as DOMRect;
    await act(async () => {
      dispatchDragEvent(rows[1], 'dragover', dataTransfer, 75);
    });
    expect(rows[1].dataset.dropPosition).toBe('after');

    await act(async () => {
      dispatchDragEvent(rows[1], 'drop', dataTransfer, 75);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].map(({id}: ProxyPattern) => id)).toEqual([
      'two',
      'one',
      'three',
    ]);
  });
});

function dispatchDragEvent(
  target: HTMLElement,
  type: string,
  dataTransfer: {
    dropEffect: string;
    effectAllowed: string;
    setData: ReturnType<typeof vi.fn>;
    setDragImage: ReturnType<typeof vi.fn>;
  },
  clientY: number,
): void {
  const event = new Event(type, {bubbles: true, cancelable: true});
  Object.defineProperties(event, {
    clientX: {value: 0},
    clientY: {value: clientY},
    dataTransfer: {value: dataTransfer},
  });
  target.dispatchEvent(event);
}
