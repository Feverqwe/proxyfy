import * as s from "superstruct";
import {Infer} from "superstruct";

const ProxyPatternStruct = s.type({
  enabled: s.boolean(),
  name: s.string(),
  type: s.union([s.literal('wildcard'), s.literal('regexp')]),
  pattern: s.string(),
});

export type Config = Infer<typeof ConfigStruct>;
export type Proxy = Infer<typeof ProxyStruct>;
export type GenericProxy = Infer<typeof GenericProxyStruct>;
export type DirectProxy = Infer<typeof DirectProxyStruct>;

const GenericProxyStruct = s.type({
  id: s.string(),
  enabled: s.boolean(),
  title: s.string(),
  color: s.string(),
  badgeText: s.optional(s.string()),
  badgeColor: s.optional(s.string()),
  type: s.union([s.literal('http'), s.literal('https'), s.literal('socks4'), s.literal('socks5'), s.literal('quic')]),
  host: s.string(),
  port: s.number(),
  username: s.optional(s.string()),
  password: s.optional(s.string()),
  whitePatterns: s.array(ProxyPatternStruct),
  blackPatterns: s.array(ProxyPatternStruct),
});

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
