import * as v from 'valibot';

import type {ProxyCredentials} from '../domain/proxy/proxyCredentials';

import type {StorageService} from './StorageService';

const PROXY_CREDENTIALS_KEY = 'proxyCredentials';

const ProxyCredentialsSchema = v.object({
  proxyId: v.string(),
  username: v.string(),
  password: v.optional(v.string()),
});

const StoredProxyCredentialsSchema = v.object({
  [PROXY_CREDENTIALS_KEY]: v.optional(v.array(ProxyCredentialsSchema), () => []),
});

export type ProxyCredentialsRepositoryErrorCode = 'corrupt' | 'unavailable';

export class ProxyCredentialsRepositoryError extends Error {
  readonly cause?: unknown;

  constructor(
    readonly code: ProxyCredentialsRepositoryErrorCode,
    message: string,
    options?: {cause?: unknown},
  ) {
    super(message);
    this.name = 'ProxyCredentialsRepositoryError';
    this.cause = options?.cause;
  }
}

export class ProxyCredentialsRepository {
  constructor(private readonly localStorage: StorageService) {}

  async read(): Promise<ProxyCredentials[]> {
    let storedCredentials: Record<string, unknown> | undefined;
    try {
      storedCredentials = await this.localStorage.get(PROXY_CREDENTIALS_KEY);
    } catch (cause) {
      throw new ProxyCredentialsRepositoryError('unavailable', 'Unable to read proxy credentials', {
        cause,
      });
    }

    try {
      return v.parse(StoredProxyCredentialsSchema, storedCredentials ?? {})[PROXY_CREDENTIALS_KEY];
    } catch (cause) {
      throw new ProxyCredentialsRepositoryError('corrupt', 'Stored proxy credentials are invalid', {
        cause,
      });
    }
  }

  async write(credentials: ProxyCredentials[]): Promise<void> {
    const validatedCredentials = v.parse(v.array(ProxyCredentialsSchema), credentials);
    try {
      await this.localStorage.set({[PROXY_CREDENTIALS_KEY]: validatedCredentials});
    } catch (cause) {
      throw new ProxyCredentialsRepositoryError(
        'unavailable',
        'Unable to write proxy credentials',
        {cause},
      );
    }
  }
}
