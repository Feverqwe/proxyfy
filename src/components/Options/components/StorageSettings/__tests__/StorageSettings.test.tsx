import React, {act} from 'react';

import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import StorageSettings from '../StorageSettings';

const runtimeMocks = vi.hoisted(() => ({
  getConfigStorageSettings: vi.fn(),
}));

vi.mock('../../../../../services/runtime/runtimeClient', () => ({
  getConfigStorageSettings: runtimeMocks.getConfigStorageSettings,
  setDefaultIconColor: vi.fn(),
  switchConfigStorage: vi.fn(),
}));

vi.mock('../../../../index', () => ({
  Header: ({title}: {title: string}) => <header>{title}</header>,
  MyColorInput: () => null,
}));

describe('StorageSettings', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    runtimeMocks.getConfigStorageSettings.mockReturnValue(new Promise(() => undefined));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('keeps the settings page structure visible while preferences load', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <StorageSettings />
        </MemoryRouter>,
      );
    });

    const loadingRegion = container.querySelector('[aria-label="Loading preferences"]');

    expect(container.querySelector('main')).not.toBeNull();
    expect(container.textContent).toContain('Back to connections');
    expect(loadingRegion?.getAttribute('aria-busy')).toBe('true');
    expect(loadingRegion?.querySelectorAll('.MuiSkeleton-root')).toHaveLength(7);
  });
});
