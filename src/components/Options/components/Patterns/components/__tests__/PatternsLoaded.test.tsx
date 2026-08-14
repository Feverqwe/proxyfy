import React, {act} from 'react';

import {ThemeProvider} from '@mui/material';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {createDefaultProxy} from '../../../../../../tools/index';
import theme from '../../../../../theme';
import {PatternsLoaded} from '../PatternsLoaded';

vi.mock('../../../../../../services/runtime/runtimeClient', () => ({
  replaceProxyPatterns: vi.fn(),
}));

describe('PatternsLoaded', () => {
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

  it('describes supported pattern formats in the help tooltip', async () => {
    await act(async () => {
      root.render(
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <PatternsLoaded proxy={createDefaultProxy({id: 'proxy-1', title: 'Office'})} />
          </MemoryRouter>
        </ThemeProvider>,
      );
    });

    const helpButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Pattern format help"]',
    );
    await act(async () => {
      helpButton?.dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(tooltip?.textContent).toContain('Wildcard examples');
    expect(tooltip?.textContent).toContain('*.example.com');
    expect(tooltip?.textContent).toContain('Regular expression');
    expect(tooltip?.textContent).toContain('scheme://host[:port]');
  });
});
