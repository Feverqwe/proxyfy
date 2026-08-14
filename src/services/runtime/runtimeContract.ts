import type {ProxyMode} from '../../domain/proxy/proxyState';
import {isProxyMode} from '../../domain/proxy/proxyState';

export const RuntimeAction = {
  GetState: 'get',
  SetProxy: 'set',
  StateChanged: 'stateChanges',
  ProxiesChanged: 'proxiesChanges',
} as const;

export type BackgroundRequest =
  | {action: typeof RuntimeAction.GetState}
  | {action: typeof RuntimeAction.SetProxy; mode: ProxyMode; id?: string};

export function parseBackgroundRequest(message: unknown): BackgroundRequest | null {
  if (!message || typeof message !== 'object' || !('action' in message)) return null;

  if (message.action === RuntimeAction.GetState) {
    return {action: RuntimeAction.GetState};
  }

  if (
    message.action !== RuntimeAction.SetProxy ||
    !('mode' in message) ||
    !isProxyMode(message.mode)
  ) {
    return null;
  }
  if ('id' in message && message.id !== undefined && typeof message.id !== 'string') return null;

  return {
    action: RuntimeAction.SetProxy,
    mode: message.mode,
    ...('id' in message && typeof message.id === 'string' ? {id: message.id} : {}),
  };
}

export function hasRuntimeAction(
  message: unknown,
  action: (typeof RuntimeAction)[keyof typeof RuntimeAction],
): boolean {
  return Boolean(
    message && typeof message === 'object' && 'action' in message && message.action === action,
  );
}
