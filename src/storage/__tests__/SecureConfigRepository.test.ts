import {beforeEach, describe, expect, it, vi} from 'vitest';

import {createChromeStorageMock} from '../../__tests__/mocks/chromeMocks';
import type {Config} from '../../tools/ConfigSchema';
import {ConfigRepository} from '../ConfigRepository';
import {
  ProxyCredentialsRepository,
  ProxyCredentialsRepositoryError,
} from '../ProxyCredentialsRepository';
import {SecureConfigRepository} from '../SecureConfigRepository';

const configWithCredentials: Config = {
  proxies: [
    {
      id: 'office',
      enabled: true,
      title: 'Office',
      color: '#123456',
      type: 'http',
      host: 'proxy.example.com',
      port: 8080,
      username: 'alice',
      password: 'secret',
      whitePatterns: [],
      blackPatterns: [],
    },
  ],
};

describe('SecureConfigRepository', () => {
  const configStorage = createChromeStorageMock();
  const localStorage = createChromeStorageMock();

  beforeEach(() => {
    configStorage._reset();
    localStorage._reset();
    vi.restoreAllMocks();
  });

  function createRepository() {
    return new SecureConfigRepository(
      new ConfigRepository(configStorage),
      new ProxyCredentialsRepository(localStorage),
    );
  }

  it('migrates embedded credentials to local storage and sanitizes config storage', async () => {
    await configStorage.set(configWithCredentials);

    await expect(createRepository().read()).resolves.toEqual(configWithCredentials);
    await expect(configStorage.get('proxies')).resolves.toEqual({
      proxies: [
        {
          id: 'office',
          enabled: true,
          title: 'Office',
          color: '#123456',
          type: 'http',
          host: 'proxy.example.com',
          port: 8080,
          whitePatterns: [],
          blackPatterns: [],
        },
      ],
    });
    await expect(localStorage.get('proxyCredentials')).resolves.toEqual({
      proxyCredentials: [{proxyId: 'office', username: 'alice', password: 'secret'}],
    });
  });

  it('merges local credentials into the configuration returned to the application', async () => {
    await configStorage.set({
      proxies: [
        {
          ...configWithCredentials.proxies[0],
          username: undefined,
          password: undefined,
        },
      ],
    });
    await localStorage.set({
      proxyCredentials: [{proxyId: 'office', username: 'local-user', password: 'local-secret'}],
    });

    const config = await createRepository().read();

    expect(config.proxies[0]).toMatchObject({
      username: 'local-user',
      password: 'local-secret',
    });
  });

  it('never writes credentials into the selected config storage', async () => {
    await createRepository().write(configWithCredentials);

    const storedConfig = await configStorage.get('proxies');
    expect(JSON.stringify(storedConfig)).not.toContain('alice');
    expect(JSON.stringify(storedConfig)).not.toContain('secret');
    await expect(localStorage.get('proxyCredentials')).resolves.toEqual({
      proxyCredentials: [{proxyId: 'office', username: 'alice', password: 'secret'}],
    });
  });

  it('restores previous credentials when saving public config fails', async () => {
    await localStorage.set({
      proxyCredentials: [{proxyId: 'office', username: 'previous', password: 'previous-secret'}],
    });
    vi.spyOn(configStorage, 'set').mockRejectedValue(new Error('Sync quota exceeded'));

    await expect(createRepository().write(configWithCredentials)).rejects.toThrow(
      'Unable to write proxy configuration',
    );
    await expect(localStorage.get('proxyCredentials')).resolves.toEqual({
      proxyCredentials: [{proxyId: 'office', username: 'previous', password: 'previous-secret'}],
    });
  });

  it('classifies unavailable credential storage without writing public config', async () => {
    vi.spyOn(localStorage, 'set').mockRejectedValue(new Error('Local storage unavailable'));
    const configWrite = vi.spyOn(configStorage, 'set');

    await expect(createRepository().write(configWithCredentials)).rejects.toMatchObject({
      code: 'unavailable',
    });
    expect(configWrite).not.toHaveBeenCalled();
  });

  it('classifies corrupt stored credentials', async () => {
    await configStorage.set({proxies: []});
    await localStorage.set({proxyCredentials: [{proxyId: 42}]});

    const read = createRepository().read();
    await expect(read).rejects.toBeInstanceOf(ProxyCredentialsRepositoryError);
    await expect(read).rejects.toMatchObject({code: 'corrupt'});
  });
});
