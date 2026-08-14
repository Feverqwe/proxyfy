import type {ProxyMode, ProxyState} from '../../domain/proxy/proxyState';
import {LocalStorageService, ProxySelectionRepository} from '../../storage/index';
import {RuntimeAction} from '../runtime/runtimeContract';
import {syncUiState} from '../ui/uiStateService';

import {ProxySelectionError, setProxy} from './proxyService';
import {getCurrentState} from './proxyStateService';

const selectionRepository = new ProxySelectionRepository(new LocalStorageService());

export async function applyProxy(mode: ProxyMode, id?: string): Promise<void> {
  const selection = await setProxy(mode, id);
  await selectionRepository.write(selection);
  await syncUiState();
}

export async function applyConfig(): Promise<void> {
  const state = await getCurrentState();
  if (!state) return;

  let selection: ProxyState;
  try {
    selection = await setProxy(state.mode, state.id);
  } catch (err) {
    if (!(err instanceof ProxySelectionError)) throw err;
    selection = await setProxy('system');
  }
  await selectionRepository.write(selection);

  try {
    await chrome.runtime.sendMessage({action: RuntimeAction.ProxiesChanged});
  } catch (_err) {
    // pass
  }

  await syncUiState();
}
