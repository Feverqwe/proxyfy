import type {ProxyMode, ProxyState} from '../../domain/proxy/proxyState';
import {parseProxyState} from '../../domain/proxy/proxyState';
import type {Config, ConfigProxy, ProxyPattern} from '../../tools/ConfigSchema';
import {parseConfig} from '../../tools/ConfigSchema';
import {throwIfResponseError} from '../../tools/chromeApi';

import type {BackgroundRequest} from './runtimeContract';
import {RuntimeAction} from './runtimeContract';

export async function getProxyState(): Promise<ProxyState | null> {
  const response = await sendRequest({action: RuntimeAction.GetState});
  if (response === null) return null;

  const state = parseProxyState(response);
  if (!state) throw new Error('Background returned an invalid proxy state');
  return state;
}

export async function selectProxy(mode: ProxyMode, id?: string): Promise<void> {
  await sendRequest({
    action: RuntimeAction.SetProxy,
    mode,
    id,
  });
}

export async function getConfigFromBackground(): Promise<Config> {
  const response = await sendRequest({action: RuntimeAction.GetConfig});
  return parseConfig(response);
}

export async function replaceConfig(config: Config): Promise<void> {
  await sendRequest({action: RuntimeAction.ReplaceConfig, config});
}

export async function saveProxyConfig(proxy: ConfigProxy, isNew: boolean): Promise<void> {
  await sendRequest({action: RuntimeAction.SaveProxy, proxy, isNew});
}

export async function removeProxyConfig(proxyId: string): Promise<void> {
  await sendRequest({action: RuntimeAction.RemoveProxy, proxyId});
}

export async function moveProxyConfig(proxyId: string, offset: -1 | 1): Promise<void> {
  await sendRequest({action: RuntimeAction.MoveProxy, proxyId, offset});
}

export async function setProxyConfigEnabled(proxyId: string, enabled: boolean): Promise<void> {
  await sendRequest({action: RuntimeAction.SetProxyEnabled, proxyId, enabled});
}

export async function cloneProxyConfig(proxyId: string, cloneId: string): Promise<void> {
  await sendRequest({action: RuntimeAction.CloneProxy, proxyId, cloneId});
}

export async function replaceProxyPatterns(
  proxyId: string,
  whitePatterns: ProxyPattern[],
  blackPatterns: ProxyPattern[],
): Promise<void> {
  await sendRequest({
    action: RuntimeAction.ReplaceProxyPatterns,
    proxyId,
    whitePatterns,
    blackPatterns,
  });
}

export async function switchConfigStorage(storageType: 'sync' | 'local'): Promise<void> {
  await sendRequest({action: RuntimeAction.SwitchStorage, storageType});
}

export type ConfigStorageSettings = {
  storageType: 'sync' | 'local';
  defaultIconColor: string;
};

export async function getConfigStorageSettings(): Promise<ConfigStorageSettings> {
  const response = await sendRequest({action: RuntimeAction.GetStorageSettings});
  if (
    !response ||
    typeof response !== 'object' ||
    !('storageType' in response) ||
    (response.storageType !== 'sync' && response.storageType !== 'local') ||
    !('defaultIconColor' in response) ||
    typeof response.defaultIconColor !== 'string'
  ) {
    throw new Error('Background returned invalid storage settings');
  }

  return {
    storageType: response.storageType,
    defaultIconColor: response.defaultIconColor,
  };
}

export async function setDefaultIconColor(color: string): Promise<void> {
  await sendRequest({action: RuntimeAction.SetDefaultIconColor, color});
}

async function sendRequest(request: BackgroundRequest): Promise<unknown> {
  const response: unknown = await chrome.runtime.sendMessage(request);
  throwIfResponseError(response);
  return response;
}
