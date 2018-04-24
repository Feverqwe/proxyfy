FindProxyForURL = (function () {
  const {regexpPatterns, cidrPatterns, invertBypassList, proxies} = config;
  const URL = require('url-parse');
  const getIpAddrFromHostname = require('./tools/getIpAddrFromHostname').default;
  const ip6addr = require('ip6addr');

  const originRe = regexpPatterns.length !== 0 && new RegExp(regexpPatterns.join('|'));
  const cidrList = cidrPatterns.length !== 0 && cidrPatterns.map(pattern => ip6addr.createCIDR(pattern));

  return function (url) {
    const {protocol, origin, hostname} = new URL(url);

    let inBypassList = originRe && originRe.test(origin);
    if (!inBypassList && cidrList) {
      const ipAddr = getIpAddrFromHostname(hostname);
      if (ipAddr) {
        inBypassList = cidrList.some(cidr => cidr.contains(ipAddr));
      }
    }

    let useProxy = true;
    if (inBypassList) {
      useProxy = false;
    }
    if (invertBypassList) {
      useProxy = !useProxy;
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
      return `${proxy.scheme} ${proxy.url}`;
    } else {
      return 'DIRECT';
    }
  };
})();