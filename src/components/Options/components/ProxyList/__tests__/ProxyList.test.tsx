import React, {act} from 'react';

import {ThemeProvider} from '@mui/material';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ConfigProxy, ProxyPatternType} from '../../../../../tools/index';
import theme from '../../../../theme';
import ProxyList from '../ProxyList';

const hookValues = vi.hoisted(() => ({proxies: [] as unknown[]}));
const runtimeMocks = vi.hoisted(() => ({moveProxyConfig: vi.fn()}));

vi.mock('../../../../index', () => ({
  CopyIcon: () => null,
  Header: () => null,
  Notification: () => null,
  ProxySelect: () => null,
  useActualProxies: () => hookValues.proxies,
}));

vi.mock('../../../../../services/runtime/runtimeClient', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../../../services/runtime/runtimeClient')>();
  return {...actual, moveProxyConfig: runtimeMocks.moveProxyConfig};
});

const proxies: ConfigProxy[] = ['one', 'two', 'three'].map((id) => ({
  id,
  enabled: true,
  title: id,
  color: '#1976d2',
  type: 'direct',
  whitePatterns: [{enabled: true, name: 'All', pattern: '*', type: ProxyPatternType.Wildcard}],
  blackPatterns: [],
}));

describe('ProxyList', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    hookValues.proxies = proxies;
    runtimeMocks.moveProxyConfig.mockResolvedValue(undefined);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('persists a multi-position move when a proxy is dropped on another row', async () => {
    let resolveMove = () => undefined;
    runtimeMocks.moveProxyConfig.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveMove = resolve;
        }),
    );
    await act(async () => {
      root.render(
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <ProxyList />
          </MemoryRouter>
        </ThemeProvider>,
      );
    });

    const handles = container.querySelectorAll<HTMLElement>('[title="Drag to reorder"]');
    const target = container.querySelector<HTMLElement>('[data-proxy-id="three"]');
    const dataTransfer = {
      dropEffect: 'none',
      effectAllowed: 'none',
      setData: vi.fn(),
      setDragImage: vi.fn(),
    };
    expect(handles).toHaveLength(3);
    expect(container.querySelector('[aria-label^="Move "]')).toBeNull();
    expect(target).not.toBeNull();

    await act(async () => dispatchDragEvent(handles[0], 'dragstart', dataTransfer, 0));
    if (!target) return;
    target.getBoundingClientRect = () =>
      ({top: 0, bottom: 100, height: 100, left: 0, right: 100, width: 100, x: 0, y: 0}) as DOMRect;
    await act(async () => dispatchDragEvent(target, 'dragover', dataTransfer, 75));
    expect(target.dataset.dropPosition).toBe('after');

    await act(async () => {
      dispatchDragEvent(target, 'drop', dataTransfer, 75);
    });

    expect(runtimeMocks.moveProxyConfig).toHaveBeenCalledWith('one', 2);
    await act(async () => resolveMove());
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
