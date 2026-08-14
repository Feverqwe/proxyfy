import React, {act} from 'react';

import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {createDefaultProxy} from '../../../../../tools/index';
import ProxyForm from '../components/ProxyForm';

vi.mock('../../../../../services/runtime/runtimeClient', () => ({
  saveProxyConfig: vi.fn(),
}));

vi.mock('../../../../index', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../index')>();
  return {
    ...actual,
    Header: ({title}: {title: string}) => <header>{title}</header>,
    MyColorInput: ({label}: {label: string}) => <input aria-label={label} />,
    Notification: () => null,
  };
});

describe('ProxyForm', () => {
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

  it('keeps all settings visible and secondary save actions in a compact menu', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <ProxyForm proxy={createDefaultProxy()} onReset={vi.fn()} />
        </MemoryRouter>,
      );
    });

    expect(container.querySelector('input[name="host"]')).not.toBeNull();
    expect(container.querySelector('input[name="port"]')).not.toBeNull();
    expect(container.textContent).toContain('Display');
    expect(container.textContent).toContain('Automatic routing');
    expect(container.querySelector('input[aria-label="Icon color"]')).not.toBeNull();

    const moreButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'More',
    );
    await act(async () => moreButton?.click());

    expect(document.body.textContent).toContain('Save and add another');
    expect(document.body.textContent).toContain('Save and edit rules');
  });
});
