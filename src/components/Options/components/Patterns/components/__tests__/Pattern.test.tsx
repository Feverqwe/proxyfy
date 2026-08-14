import React, {act} from 'react';

import {ThemeProvider} from '@mui/material';
import {createRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ProxyPattern, ProxyPatternType} from '../../../../../../tools/index';
import theme from '../../../../../theme';
import {Pattern} from '../Pattern';

const pattern: ProxyPattern = {
  id: 'rule-1',
  enabled: true,
  name: 'Example',
  pattern: '*.example.com',
  type: ProxyPatternType.Wildcard,
};

describe('Pattern', () => {
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

  it('keeps secondary rule actions in a menu', async () => {
    const onCopy = vi.fn();
    const onDelete = vi.fn();
    const onMove = vi.fn();

    await act(async () => {
      root.render(
        <ThemeProvider theme={theme}>
          <Pattern
            pattern={pattern}
            isFirst={false}
            isLast={false}
            isDragging={false}
            onChange={vi.fn()}
            onCopy={onCopy}
            onDelete={onDelete}
            onMove={onMove}
            onDragStart={vi.fn()}
            onDragEnd={vi.fn()}
            onDragOver={vi.fn()}
            onDrop={vi.fn()}
          />
        </ThemeProvider>,
      );
    });

    const actionsButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Rule actions"]',
    );
    await act(async () => actionsButton?.click());

    const duplicateItem = [
      ...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ].find((item) => item.textContent?.includes('Duplicate'));
    expect(duplicateItem).toBeDefined();

    await act(async () => duplicateItem?.click());
    expect(onCopy).toHaveBeenCalledWith(pattern);
    expect(onMove).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
