import {syncUiState} from '../ui/uiStateService';

import {setProxy} from './proxyService';
import {getCurrentState} from './proxyStateService';

export async function applyProxy(mode: string, id?: string): Promise<void> {
  await setProxy(mode, id);
  await syncUiState();
}

export async function applyConfig(): Promise<void> {
  const state = await getCurrentState();
  if (!state) return;

  await setProxy(state.mode, state.id);

  try {
    await chrome.runtime.sendMessage({action: 'proxiesChanges'});
  } catch (_err) {
    // pass
  }

  await syncUiState();
}
