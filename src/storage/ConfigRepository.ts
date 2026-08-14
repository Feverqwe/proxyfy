import type {Config} from '../tools/ConfigSchema';
import {assertConfig, parseStoredConfig} from '../tools/ConfigSchema';

import type {StorageService} from './StorageService';

export type ConfigRepositoryErrorCode = 'corrupt' | 'unavailable';

export class ConfigRepositoryError extends Error {
  readonly cause?: unknown;

  constructor(
    readonly code: ConfigRepositoryErrorCode,
    message: string,
    options?: {cause?: unknown},
  ) {
    super(message);
    this.name = 'ConfigRepositoryError';
    this.cause = options?.cause;
  }
}

export class ConfigRepository {
  constructor(private readonly storage: StorageService) {}

  async read(): Promise<Config> {
    let storedConfig: Record<string, unknown>;
    try {
      storedConfig = await this.storage.get('proxies');
    } catch (cause) {
      throw new ConfigRepositoryError('unavailable', 'Unable to read proxy configuration', {
        cause,
      });
    }

    try {
      return parseStoredConfig(storedConfig);
    } catch (cause) {
      throw new ConfigRepositoryError('corrupt', 'Stored proxy configuration is invalid', {
        cause,
      });
    }
  }

  async write(config: Config): Promise<void> {
    assertConfig(config);

    try {
      await this.storage.set({proxies: config.proxies});
    } catch (cause) {
      throw new ConfigRepositoryError('unavailable', 'Unable to write proxy configuration', {
        cause,
      });
    }
  }
}
