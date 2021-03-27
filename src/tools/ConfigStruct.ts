import * as s from "superstruct";

const ProxyPatternStruct = s.type({
  enabled: s.boolean(),
  name: s.string(),
  type: s.union([s.literal('wildcard'), s.literal('regexp')]),
  pattern: s.string(),
  // protocol: s.nullable(s.union([s.literal('http'), s.literal('https')]))
});

const ConfigStruct = s.type({
  mode: s.union([
    s.literal('patterns'),
    s.literal('fixed_servers'),
    s.literal('auto_detect'),
    s.literal('system'),
    s.literal('direct'),
  ]),
  fixedProxyId: s.nullable(s.string()),
  proxies: s.array(s.type({
    id: s.string(),
    enabled: s.boolean(),
    title: s.string(),
    color: s.optional(s.string()),
    badgeColor: s.optional(s.tuple([s.number(), s.number(), s.number(), s.number()])),
    scheme: s.union([s.literal('http'), s.literal('https'), s.literal('socks4'), s.literal('socks5')]),
    host: s.string(),
    port: s.number(),
    username: s.string(),
    password: s.string(),
    whitePatterns: s.array(ProxyPatternStruct),
    blackPatterns: s.array(ProxyPatternStruct),
  })),
});


export default ConfigStruct;
export {ProxyPatternStruct};
