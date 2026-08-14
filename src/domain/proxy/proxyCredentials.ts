import type {Config, ConfigProxy} from '../../tools/ConfigSchema';

export type ProxyCredentials = {
  proxyId: string;
  username: string;
  password?: string;
};

export type ResolvedProxyCredentials = {
  config: Config;
  credentials: ProxyCredentials[];
  hadEmbeddedCredentials: boolean;
};

export function stripProxyCredentials(config: Config): Config {
  return {
    ...config,
    proxies: config.proxies.map(stripCredentialsFromProxy),
  };
}

export function extractProxyCredentials(config: Config): ProxyCredentials[] {
  return config.proxies.flatMap((proxy) => {
    if (proxy.type === 'direct' || !proxy.username) return [];

    return [
      {
        proxyId: proxy.id,
        username: proxy.username,
        ...(proxy.password !== undefined ? {password: proxy.password} : {}),
      },
    ];
  });
}

export function resolveProxyCredentials(
  config: Config,
  storedCredentials: ProxyCredentials[],
): ResolvedProxyCredentials {
  const embeddedCredentials = extractProxyCredentials(config);
  const hadEmbeddedCredentials = config.proxies.some(
    (proxy) => proxy.type !== 'direct' && ('username' in proxy || 'password' in proxy),
  );
  const storedByProxyId = new Map(
    storedCredentials.map((credentials) => [credentials.proxyId, credentials]),
  );
  embeddedCredentials.forEach((credentials) => {
    storedByProxyId.set(credentials.proxyId, credentials);
  });

  const sanitizedConfig = stripProxyCredentials(config);
  const credentials = sanitizedConfig.proxies.flatMap((proxy) => {
    if (proxy.type === 'direct') return [];
    const proxyCredentials = storedByProxyId.get(proxy.id);
    return proxyCredentials ? [proxyCredentials] : [];
  });

  return {
    config: applyProxyCredentials(sanitizedConfig, credentials),
    credentials,
    hadEmbeddedCredentials,
  };
}

function applyProxyCredentials(config: Config, credentials: ProxyCredentials[]): Config {
  const credentialsByProxyId = new Map(
    credentials.map((proxyCredentials) => [proxyCredentials.proxyId, proxyCredentials]),
  );

  return {
    ...config,
    proxies: config.proxies.map((proxy) => {
      if (proxy.type === 'direct') return proxy;
      const proxyCredentials = credentialsByProxyId.get(proxy.id);
      if (!proxyCredentials) return proxy;

      return {
        ...proxy,
        username: proxyCredentials.username,
        ...(proxyCredentials.password !== undefined ? {password: proxyCredentials.password} : {}),
      };
    }),
  };
}

function stripCredentialsFromProxy(proxy: ConfigProxy): ConfigProxy {
  if (proxy.type === 'direct') return proxy;
  const {username: _username, password: _password, ...sanitizedProxy} = proxy;
  return sanitizedProxy;
}
