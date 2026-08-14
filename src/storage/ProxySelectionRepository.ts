import {parseProxyState} from '../domain/proxy/proxyState';
import type {ProxyState} from '../domain/proxy/proxyState';

import type {StorageService} from './StorageService';

const ACTIVE_PROXY_SELECTION_KEY = 'activeProxySelection';

export class ProxySelectionRepository {
  constructor(private readonly storage: StorageService) {}

  async read(): Promise<ProxyState | null> {
    const result = await this.storage.get(ACTIVE_PROXY_SELECTION_KEY);
    return parseProxyState(result[ACTIVE_PROXY_SELECTION_KEY]);
  }

  async write(selection: ProxyState): Promise<void> {
    await this.storage.set({[ACTIVE_PROXY_SELECTION_KEY]: selection});
  }

  async clear(): Promise<void> {
    await this.storage.remove(ACTIVE_PROXY_SELECTION_KEY);
  }
}
