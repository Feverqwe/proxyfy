import type {ProxyMode, ProxyState} from '../../domain/proxy/proxyState';
import {parseProxyState} from '../../domain/proxy/proxyState';
import {throwIfResponseError} from '../../tools/chromeApi';

import {RuntimeAction} from './runtimeContract';

export async function getProxyState(): Promise<ProxyState | null> {
  const response: unknown = await chrome.runtime.sendMessage({action: RuntimeAction.GetState});
  throwIfResponseError(response);
  if (response === null) return null;

  const state = parseProxyState(response);
  if (!state) throw new Error('Background returned an invalid proxy state');
  return state;
}

export async function selectProxy(mode: ProxyMode, id?: string): Promise<void> {
  const response: unknown = await chrome.runtime.sendMessage({
    action: RuntimeAction.SetProxy,
    mode,
    id,
  });
  throwIfResponseError(response);
}
