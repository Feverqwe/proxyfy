import {ConfigProxy, DirectProxyType, ProxyPatternType, getId} from '../../../../tools/index';
import {localhostPresets, matchAllPresets} from '../Patterns/index';

import {ProxyFormValues} from './types';

export type ProxyFormErrors = Partial<Record<keyof ProxyFormValues, string>>;

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

  const port = parseInt(values.port, 10);
  if (!port) errors.port = 'Port is required';
  return errors;
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
