import * as v from 'valibot';

import {DirectProxyType, GenericProxyType, ProxyPatternType} from './ProxyTypes';

const ProxyPatternSchema = v.object({
  id: v.optional(v.string()),
  enabled: v.boolean(),
  name: v.string(),
  type: v.enum(ProxyPatternType),
  pattern: v.string(),
});

const baseProxyEntries = {
  id: v.string(),
  enabled: v.boolean(),
  title: v.string(),
  color: v.string(),
  badgeText: v.optional(v.string()),
  badgeColor: v.optional(v.string()),
  whitePatterns: v.array(ProxyPatternSchema),
  blackPatterns: v.array(ProxyPatternSchema),
};

const GenericProxySchema = v.object({
  ...baseProxyEntries,
  type: v.enum(GenericProxyType),
  host: v.string(),
  port: v.number(),
  username: v.optional(v.string()),
  password: v.optional(v.string()),
});

const DirectProxySchema = v.object({
  ...baseProxyEntries,
  type: v.literal(DirectProxyType.Direct),
});

const ProxySchema = v.variant('type', [GenericProxySchema, DirectProxySchema]);

const ConfigSchema = v.looseObject({
  proxies: v.array(ProxySchema),
});

const StoredConfigSchema = v.looseObject({
  proxies: v.optional(v.array(ProxySchema), () => []),
});

export type ProxyPattern = v.InferOutput<typeof ProxyPatternSchema>;
export type GenericProxy = v.InferOutput<typeof GenericProxySchema>;
export type DirectProxy = v.InferOutput<typeof DirectProxySchema>;
export type ConfigProxy = v.InferOutput<typeof ProxySchema>;
export type Config = v.InferOutput<typeof ConfigSchema>;

export function parseConfig(input: unknown): Config {
  return v.parse(ConfigSchema, input);
}

export function parseStoredConfig(input: unknown): Config {
  return v.parse(StoredConfigSchema, input);
}

export function assertConfig(input: unknown): asserts input is Config {
  v.assert(ConfigSchema, input);
}

export function createDefaultProxy(input: Partial<ConfigProxy> = {}): ConfigProxy {
  return v.parse(ProxySchema, {
    id: '',
    enabled: true,
    title: '',
    color: '#66cc66',
    badgeText: '',
    badgeColor: 'rgba(96,125,139,1)',
    type: GenericProxyType.Http,
    host: '',
    port: 3128,
    whitePatterns: [],
    blackPatterns: [],
    ...input,
  });
}

export {ConfigSchema, ProxyPatternSchema, ProxySchema, StoredConfigSchema};
