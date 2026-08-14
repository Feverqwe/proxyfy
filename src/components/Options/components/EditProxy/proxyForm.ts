import {
  ConfigProxy,
  DirectProxyType,
  GenericProxyType,
  ProxyPatternType,
  getId,
} from '../../../../tools/index';
import {localhostPresets, matchAllPresets} from '../Patterns/index';

import {ProxyFormValues} from './types';

export type ProxyFormErrors = Partial<Record<keyof ProxyFormValues, string>>;

export interface ParsedProxyAddress {
  host: string;
  port?: string;
  type?: GenericProxyType;
  username?: string;
  password?: string;
}

const proxyProtocolSettings: Record<string, {type: GenericProxyType; defaultPort: string}> = {
  http: {type: GenericProxyType.Http, defaultPort: '80'},
  https: {type: GenericProxyType.Https, defaultPort: '443'},
  socks: {type: GenericProxyType.Socks5, defaultPort: '1080'},
  socks4: {type: GenericProxyType.Socks4, defaultPort: '1080'},
  socks5: {type: GenericProxyType.Socks5, defaultPort: '1080'},
  quic: {type: GenericProxyType.Quic, defaultPort: '443'},
};

export function createProxyFormValues(proxy: ConfigProxy): ProxyFormValues {
  return {
    type: proxy.type,
    title: proxy.title,
    color: proxy.color,
    badgeText: proxy.badgeText || '',
    badgeColor: proxy.badgeColor || '',
    host: 'host' in proxy ? proxy.host : '',
    port: 'port' in proxy ? String(proxy.port) : '',
    username: 'username' in proxy ? proxy.username || '' : '',
    password: 'password' in proxy ? proxy.password || '' : '',
    enabled: proxy.enabled,
    useMatchAllPreset: true,
    useLocalhostPreset: false,
  };
}

export function validateProxyForm(values: ProxyFormValues): ProxyFormErrors {
  if (values.type === DirectProxyType.Direct) return {};

  const errors: ProxyFormErrors = {};
  if (!values.host) errors.host = 'Host is required';
  else if (isMalformedProxyHost(values.host)) errors.host = 'Enter a valid proxy address';

  const port = Number(values.port);
  if (!values.port) errors.port = 'Port is required';
  else if (!/^\d+$/.test(values.port) || port < 1 || port > 65535) {
    errors.port = 'Enter a port from 1 to 65535';
  }
  return errors;
}

export function parseProxyAddress(value: string): ParsedProxyAddress | null {
  const input = value.trim();
  if (!input) return null;

  const protocolMatch = input.match(/^([a-z][a-z\d+.-]*):\/\//i);
  const protocol = protocolMatch?.[1].toLowerCase();
  const protocolSettings = protocol ? proxyProtocolSettings[protocol] : undefined;
  if (protocol && !protocolSettings) return null;

  if (!protocol && isUnbracketedIpv6(input)) {
    return {host: input};
  }

  try {
    const url = new URL(protocol ? input : `http://${input}`);
    if (!url.hostname) return null;

    const result: ParsedProxyAddress = {
      host: url.hostname.replace(/^\[(.*)]$/, '$1'),
    };
    if (url.port) result.port = url.port;

    if (protocolSettings) {
      result.type = protocolSettings.type;
      result.port ||= protocolSettings.defaultPort;
    }
    if (url.username) result.username = decodeUrlPart(url.username);
    if (url.password) result.password = decodeUrlPart(url.password);
    return result;
  } catch {
    return null;
  }
}

export function createProxyFromForm(
  original: ConfigProxy,
  values: ProxyFormValues,
  isNew: boolean,
  createId: () => string = getId,
): ConfigProxy {
  const whitePatterns = original.whitePatterns.map((pattern) => ({...pattern}));
  const blackPatterns = original.blackPatterns.map((pattern) => ({...pattern}));

  if (isNew && values.useMatchAllPreset) {
    whitePatterns.push(...createPresetPatterns(matchAllPresets, createId));
  }
  if (isNew && values.useLocalhostPreset) {
    blackPatterns.push(...createPresetPatterns(localhostPresets, createId));
  }

  const common = {
    id: isNew ? createId() : original.id,
    enabled: values.enabled,
    title: values.title || defaultTitle(values),
    color: values.color,
    badgeText: values.badgeText,
    badgeColor: values.badgeColor,
    whitePatterns,
    blackPatterns,
  };

  if (values.type === DirectProxyType.Direct) {
    return {...common, type: DirectProxyType.Direct};
  }

  const proxy: ConfigProxy = {
    ...common,
    type: values.type,
    host: values.host,
    port: parseInt(values.port, 10),
  };
  if (values.username) {
    proxy.username = values.username;
    proxy.password = values.password;
  }
  return proxy;
}

function defaultTitle(values: ProxyFormValues): string {
  return values.type === DirectProxyType.Direct ? 'Direct' : `${values.host}:${values.port}`;
}

function isUnbracketedIpv6(value: string): boolean {
  return (
    !value.startsWith('[') &&
    (value.match(/:/g) || []).length > 1 &&
    /^[\da-f:]+(?:%[\w.-]+)?$/i.test(value)
  );
}

function isMalformedProxyHost(value: string): boolean {
  if (/\s|:\/\/|@/.test(value)) return true;
  if (isUnbracketedIpv6(value) || /^\[[\da-f:]+(?:%[\w.-]+)?]$/i.test(value)) return false;
  return value.includes(':') || value.startsWith('[') || value.endsWith(']');
}

function decodeUrlPart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function createPresetPatterns(
  presets: {name: string; pattern: string; type: ProxyPatternType}[],
  createId: () => string,
) {
  return presets.map(({name, pattern, type}) => ({
    id: createId(),
    enabled: true,
    name,
    pattern,
    type,
  }));
}
