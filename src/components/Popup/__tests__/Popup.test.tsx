import React, {act} from 'react';

import {createRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {ProxyState} from '../../../domain/proxy/proxyState';
import type {ConfigProxy} from '../../../tools/ConfigSchema';
import Popup from '../Popup';

const hookValues = vi.hoisted(() => ({
  proxies: [] as ConfigProxy[] | null,
  state: null as ProxyState | null,
}));

vi.mock('../../index', () => ({
  useActualProxies: () => hookValues.proxies,
  useActualState: () => hookValues.state,
}));

describe('Popup', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    hookValues.proxies = [];
    hookValues.state = null;
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('shows routing controls when Chrome proxy settings are not controlled by the extension', async () => {
    await act(async () => root.render(<Popup />));

    expect(container.textContent).toContain('Browser settings');
    expect(container.textContent).toContain('Automatic routing');
    expect(container.textContent).toContain('System settings');
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0);
  });

  it('shows skeletons while proxy configuration is loading', async () => {
    hookValues.proxies = null;

    await act(async () => root.render(<Popup />));

    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });
});
