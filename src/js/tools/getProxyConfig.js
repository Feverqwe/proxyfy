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
        url: proxy.getPacUrl(),
      };
      if (type === 'singleProxy') {
        return true;
      }
    }
  });

  const regexpPatterns = [];
  const cidrPatterns = [];
  profile.getBypassList().forEach(rule => {
    if (rule.type === 'regexp') {
      regexpPatterns.push(rule.pattern);
    } else
    if (rule.type === 'CIDR') {
      cidrPatterns.push(rule.pattern);
    } else {
      debug('Skip rule', rule);
    }
  });

  const init = {
    regexpPatterns: _uniq(regexpPatterns),
    cidrPatterns: _uniq(cidrPatterns),
    invertBypassList: profile.invertBypassList,
    proxies: proxies
  };

  const config = {
    mode: 'pac_script',
    pacScript: {
      data: `${meta}\nvar FindProxyForURL=null;\nvar config=${JSON.stringify(init)};\n${pacScript};`,
      mandatory: false
    }
  };

  // debug('regexpPatterns', regexpPatterns);
  // debug('cidrPatterns', cidrPatterns);

  return config;
};

export default getProxyConfig;