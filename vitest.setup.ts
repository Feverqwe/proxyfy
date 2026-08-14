import {vi} from 'vitest';

// Mock escape-string-regexp for Vitest tests
vi.mock('escape-string-regexp', () => ({
  default: function escapeStringRegexp(string: string) {
    return string.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
  },
}));

// Mock Chrome API for Vitest tests
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    lastError: undefined,
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onStartup: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  proxy: {
    onProxyError: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    settings: {
      set: vi.fn(),
      clear: vi.fn(),
      onChange: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    setIcon: vi.fn(),
  },
  permissions: {
    request: vi.fn(),
  },
} as any;
