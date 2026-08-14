export const proxyModes = [
  'pac_script',
  'system',
  'fixed_servers',
  'direct',
  'auto_detect',
] as const;

export type ProxyMode = (typeof proxyModes)[number];

export type ProxyState = {
  mode: ProxyMode;
  id?: string;
};

export function isProxyMode(value: unknown): value is ProxyMode {
  return typeof value === 'string' && proxyModes.includes(value as ProxyMode);
}

export function parseProxyState(value: unknown): ProxyState | null {
  if (!value || typeof value !== 'object' || !('mode' in value) || !isProxyMode(value.mode)) {
    return null;
  }

  if ('id' in value && value.id !== undefined && typeof value.id !== 'string') {
    return null;
  }

  return {
    mode: value.mode,
    ...('id' in value && typeof value.id === 'string' ? {id: value.id} : {}),
  };
}
