import type {Config, ConfigProxy, ProxyPattern} from '../../tools/ConfigSchema';

export function removeProxy(config: Config, proxyId: string): Config {
  return withExistingProxy(config, proxyId, (proxies, index) => {
    proxies.splice(index, 1);
  });
}

export function moveProxy(config: Config, proxyId: string, offset: number): Config {
  return withExistingProxy(config, proxyId, (proxies, index) => {
    const targetIndex = Math.max(0, Math.min(proxies.length - 1, index + offset));
    if (targetIndex === index) return;

    const [proxy] = proxies.splice(index, 1);
    proxies.splice(targetIndex, 0, proxy);
  });
}

export function setProxyEnabled(config: Config, proxyId: string, enabled: boolean): Config {
  return withExistingProxy(config, proxyId, (proxies, index) => {
    proxies[index] = {...proxies[index], enabled};
  });
}

export function cloneProxy(config: Config, proxyId: string, cloneId: string): Config {
  return withExistingProxy(config, proxyId, (proxies, index) => {
    const proxy = proxies[index];
    proxies.push({
      ...proxy,
      id: cloneId,
      title: `Copy of ${proxy.title}`,
      whitePatterns: proxy.whitePatterns.map((pattern) => ({...pattern})),
      blackPatterns: proxy.blackPatterns.map((pattern) => ({...pattern})),
    });
  });
}

export function saveProxy(config: Config, proxy: ConfigProxy, isNew: boolean): Config {
  if (isNew) {
    return {...config, proxies: [...config.proxies, proxy]};
  }

  return withExistingProxy(config, proxy.id, (proxies, index) => {
    proxies[index] = proxy;
  });
}

export function replaceProxyPatterns(
  config: Config,
  proxyId: string,
  whitePatterns: ProxyPattern[],
  blackPatterns: ProxyPattern[],
): Config {
  return withExistingProxy(config, proxyId, (proxies, index) => {
    proxies[index] = {
      ...proxies[index],
      whitePatterns,
      blackPatterns,
    };
  });
}

function withExistingProxy(
  config: Config,
  proxyId: string,
  update: (proxies: ConfigProxy[], index: number) => void,
): Config {
  const proxies = config.proxies.slice();
  const index = proxies.findIndex((proxy) => proxy.id === proxyId);
  if (index === -1) {
    throw new Error(`Proxy is not found: ${proxyId}`);
  }

  update(proxies, index);
  return {...config, proxies};
}
