import _uniq from "lodash.uniq";

const debug = require('debug')('getProxyConfig');

const getProxyConfig = (profile, pacScript) => {
  const meta = '//' + JSON.stringify({proxyfy: profile.name});

  const proxies = {};
  ['singleProxy', 'proxyForHttp', 'proxyForHttps', 'proxyForFtp', 'fallbackProxy'].some(type => {
    const proxy = profile[type];
    if (proxy) {
      let protocol = type;
      const m = /proxyFor(Https|Http|Ftp)/.exec(type);
      if (m) {
        protocol = m[1].toLowerCase() + ':';
      }
      proxies[protocol] = {
        scheme: proxy.getPacScheme(),
        url: proxy.getUrl(),
      }
    }
  });

  const hostList = [];
  const cidrList = [];
  profile.getBypassList().forEach(rule => {
    if (rule.type === 'regexp') {
      hostList.push(rule.pattern);
    } else
    if (rule.type === 'CIDR') {
      cidrList.push(rule.pattern);
    } else {
      debug('Skip rule', rule);
    }
  });

  const init = {
    hostList: _uniq(hostList),
    cidrList: _uniq(cidrList),
    invertBypassList: profile.invertBypassList,
    proxies: proxies
  };

  const config = {
    mode: 'pac_script',
    pacScript: {
      data: `${meta}\nvar FindProxyForURL=null;\nvar init=${JSON.stringify(init)};\n${pacScript};`
    }
  };

  // debug('hostList', hostList);
  // debug('cidrList', cidrList);

  return config;
};

export default getProxyConfig;