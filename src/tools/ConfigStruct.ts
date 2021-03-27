import * as s from "superstruct";
import {Infer} from "superstruct";

const ProxyPatternStruct = s.type({
  enabled: s.boolean(),
  name: s.string(),
  type: s.union([s.literal('wildcard'), s.literal('regexp')]),
  pattern: s.string(),
  // protocol: s.nullable(s.union([s.literal('http'), s.literal('https')]))
});

export type Config = Infer<typeof ConfigStruct>;
export type Proxy = Infer<typeof ProxyStruct>;

const ProxyStruct = s.type({
  id: s.string(),
  enabled: s.boolean(),
  title: s.string(),
  color: s.string(),
  badgeColor: s.optional(s.tuple([s.number(), s.number(), s.number(), s.number()])),
  type: s.union([s.literal('http'), s.literal('https'), s.literal('socks4'), s.literal('socks5'), s.literal('system'), s.literal('direct')]),
  host: s.string(),
  port: s.number(),
  username: s.optional(s.string()),
  password: s.optional(s.string()),
  whitePatterns: s.array(ProxyPatternStruct),
  blackPatterns: s.array(ProxyPatternStruct),
});

const ConfigStruct = s.type({
  proxies: s.array(ProxyStruct),
});

const DefaultProxyStruct = s.defaulted(ProxyStruct, {
  id: '',
  enabled: true,
  title: '',
  color: '#66cc66',
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
