import {AUTH_SUPPORTED} from '../../constants';
import {StorageSettings} from '../../storage/index';
import {authListener as AuthListener, getConfig, getExtensionIcon} from '../../tools/index';
import {getCurrentState} from '../proxy/proxyStateService';
import {RuntimeAction} from '../runtime/runtimeContract';

let authListener: AuthListener | null = null;

export function parseRgbaColor(color: string): [number, number, number, number] | null {
  const match = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*\.?\d+)\s*\)$/.exec(color);
  if (!match) return null;

  const [, red, green, blue, alpha] = match;
  const [r, g, b, a] = [red, green, blue, alpha].map(Number);
  if (
    ![r, g, b, a].every(Number.isFinite) ||
    ![r, g, b].every((value) => value >= 0 && value <= 255) ||
    a < 0 ||
    a > 1
  ) {
    return null;
  }

  return [r, g, b, Math.round(a * 255)];
}

export async function syncUiState(): Promise<void> {
  const state = await getCurrentState();
  const config = await getConfig();
  let badgeColor = [0, 0, 0, 0];
  let badgeText = '';
  let iconColor;
  let newAuthListener: AuthListener | null = null;

  const storageSettings = StorageSettings.getInstance();
  await storageSettings.initialize();
  const defaultIconColor = storageSettings.getDefaultIconColor();

  if (state) {
    switch (state.mode) {
      case 'direct':
      case 'fixed_servers': {
        const {id} = state;
        let proxy = config.proxies.find((p) => p.id === id);
        if (!proxy && state.mode === 'direct') {
          proxy = config.proxies.find((p) => p.type === 'direct');
        }
        if (proxy) {
          iconColor = proxy.color;
          if (proxy.badgeText) {
            badgeText = proxy.badgeText;
          }
          if (proxy.badgeColor) {
            const parsedBadgeColor = parseRgbaColor(proxy.badgeColor);
            if (parsedBadgeColor) {
              badgeColor = parsedBadgeColor;
            }
          }
          if (AUTH_SUPPORTED) {
            newAuthListener = new AuthListener([proxy]);
          }
        }
        break;
      }
      case 'pac_script': {
        iconColor = defaultIconColor;
        if (AUTH_SUPPORTED) {
          newAuthListener = new AuthListener(config.proxies);
        }
        break;
      }
    }
  }

  if (authListener) {
    authListener.destroy();
    authListener = null;
  }
  if (newAuthListener && newAuthListener.isRequired) {
    authListener = newAuthListener;
    authListener.enable();
  }

  try {
    await Promise.all([
      chrome.action.setBadgeText({
        text: badgeText,
      }),
      chrome.action.setBadgeBackgroundColor({
        color: badgeColor as [number, number, number, number],
      }),
      chrome.action.setIcon({
        imageData: {
          16: getExtensionIcon(iconColor, 16),
          24: getExtensionIcon(iconColor, 24),
          32: getExtensionIcon(iconColor, 32),
        },
      }),
    ]);
  } catch (err) {
    console.error('Change badge error: %O', err);
  }

  try {
    await chrome.runtime.sendMessage({action: RuntimeAction.StateChanged});
  } catch (_err) {
    // pass
  }
}
