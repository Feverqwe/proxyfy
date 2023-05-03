import * as s from 'superstruct';

export enum ProxyPatternType {
  Wildcard = 'wildcard',
  Regexp = 'regexp',
}

const ProxyPatternTypeStruct = s.union([s.literal('wildcard'), s.literal('regexp')]);

const ProxyPatternStruct = s.type({
  enabled: s.boolean(),
  name: s.string(),
  type: ProxyPatternTypeStruct,
  pattern: s.string(),
});

export interface ProxyPattern {
  enabled: boolean;
  name: string;
  type: ProxyPatternType;
  pattern: string;
}

interface BaseProxy {
  id: string;
  enabled: boolean;
  title: string;
  color: string;
  badgeText?: string;
  badgeColor?: string;
  whitePatterns: ProxyPattern[];
  blackPatterns: ProxyPattern[];
}

export enum GenericProxyType {
  Http = 'http',
  Https = 'https',
  Socks4 = 'socks4',
  Socks5 = 'socks5',
  Quic = 'quic',
}

export enum DirectProxyType {
  Direct = 'direct',
}

export interface GenericProxy extends BaseProxy {
  type: GenericProxyType;
  host: string;
  port: number;
  username?: string;
  password?: string;
}

const GenericProxyStruct = s.type({
  id: s.string(),
  enabled: s.boolean(),
  title: s.string(),
  color: s.string(),
  badgeText: s.optional(s.string()),
  badgeColor: s.optional(s.string()),
  type: s.union([
    s.literal('http'),
    s.literal('https'),
    s.literal('socks4'),
    s.literal('socks5'),
    s.literal('quic'),
  ]),
  host: s.string(),
  port: s.number(),
  username: s.optional(s.string()),
  password: s.optional(s.string()),
  whitePatterns: s.array(ProxyPatternStruct),
  blackPatterns: s.array(ProxyPatternStruct),
});

export interface DirectProxy extends BaseProxy {
  type: DirectProxyType.Direct;
}

const DirectProxyStruct = s.type({
  id: s.string(),
  enabled: s.boolean(),
  title: s.string(),
  color: s.string(),
  badgeText: s.optional(s.string()),
  badgeColor: s.optional(s.string()),
  type: s.literal('direct'),
  whitePatterns: s.array(ProxyPatternStruct),
  blackPatterns: s.array(ProxyPatternStruct),
});

const ProxyStruct = s.union([GenericProxyStruct, DirectProxyStruct]);

export type ConfigProxy = GenericProxy | DirectProxy;

export interface Config {
  proxies: ConfigProxy[];
}

const ConfigStruct = s.type({
  proxies: s.array(ProxyStruct),
});

const DefaultProxyStruct = s.defaulted(ProxyStruct, {
  id: '',
  enabled: true,
  title: '',
  color: '#66cc66',
  badgeText: '',
  badgeColor: 'rgba(96,125,139,1)',
  type: 'http',
  host: '',
  port: 3128,
  whitePatterns: [],
  blackPatterns: [],
});

const DefaultConfigStruct = s.defaulted(ConfigStruct, {
  proxies: [],
});

export default ConfigStruct;
export {ProxyStruct, ProxyPatternStruct, DefaultConfigStruct, DefaultProxyStruct};
