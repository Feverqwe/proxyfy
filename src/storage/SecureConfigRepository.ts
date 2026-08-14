import {
  extractProxyCredentials,
  resolveProxyCredentials,
  stripProxyCredentials,
} from '../domain/proxy/proxyCredentials';
import type {Config} from '../tools/ConfigSchema';

import type {ConfigRepository} from './ConfigRepository';
import type {ProxyCredentialsRepository} from './ProxyCredentialsRepository';

export class SecureConfigRepositoryError extends Error {
  readonly code = 'unavailable';

  constructor(
    message: string,
    readonly causes: unknown[],
  ) {
    super(message);
    this.name = 'SecureConfigRepositoryError';
  }
}

export class SecureConfigRepository {
  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly credentialsRepository: ProxyCredentialsRepository,
  ) {}

  async read(): Promise<Config> {
    const config = await this.configRepository.read();
    const storedCredentials = await this.credentialsRepository.read();
    const resolved = resolveProxyCredentials(config, storedCredentials);

    if (resolved.hadEmbeddedCredentials) {
      await this.credentialsRepository.write(resolved.credentials);
      await this.configRepository.write(stripProxyCredentials(config));
    }

    return resolved.config;
  }

  async write(config: Config): Promise<void> {
    const previousCredentials = await this.credentialsRepository.read();
    const nextCredentials = extractProxyCredentials(config);

    await this.credentialsRepository.write(nextCredentials);

    try {
      await this.configRepository.write(stripProxyCredentials(config));
    } catch (cause) {
      try {
        await this.credentialsRepository.write(previousCredentials);
      } catch (rollbackCause) {
        throw new SecureConfigRepositoryError(
          'Unable to save proxy configuration or restore credentials',
          [cause, rollbackCause],
        );
      }
      throw cause;
    }
  }
}
