const debug = require('debug')('getProxyConfig');

const getProxyConfig = profile => {
  const meta = '//' + JSON.stringify({proxyfy: profile.name});

  const proxies = {};
  ['singleProxy', 'proxyForHttp', 'proxyForHttps', 'proxyForFtp', 'fallbackProxy'].some(type => {
    const proxy = profile[type];
    if (proxy) {
      let protocol = type;
      const m = /proxyFor(Https|Http|Ftp)/.exec(type);
      if (m) {
        protocol = m[1].toLowerCase();
      }
      proxies[protocol] = {
        scheme: proxy.getPacScheme(),
        url: proxy.getUrl(),
      }
    }
  });

  const bypassListRe = [];
  profile.getBypassList().forEach(rule => {
    if (rule.type === 'regexp') {
      bypassListRe.push(rule.pattern);
    } else {
      debug('Skip rule', rule);
    }
  });

  const config = {
    mode: 'pac_script',
    pacScript: {
      data: `${meta}\nvar FindProxyForURL=(${function (bypassListRe, invertBypassList, proxies) {
        const bypassList = bypassListRe && new RegExp(bypassListRe);
        return function (url) {
          const m = /^(([^:]+):\/\/[^\/?#]+)/.exec(url);
          if (m) {
            m.shift();
            const [hostname, protocol] = m;
            let useProxy = true;
            if (bypassList) {
              useProxy = !bypassList.test(hostname);
              if (invertBypassList) {
                useProxy = !useProxy;
              }
            }

            let proxy = null;
            if (useProxy) {
              proxy = proxies.singleProxy;
              if (!proxy) {
                proxy = proxies[protocol];
                if (!proxy) {
                  proxy = proxies.fallbackProxy;
                }
              }
            }
            
            if (proxy) {
              return proxy.scheme + ' ' + proxy.url;
            } else {
              return "DIRECT";
            }
          } else {
            return "DIRECT";
          }
        };
      }})(${[
        bypassListRe.join('|'),
        profile.invertBypassList,
        proxies
      ].map(JSON.stringify).join(',')});`
    }
  };

  // debug('config', config);

  return config;
};

export default getProxyConfig;