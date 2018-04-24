FindProxyForURL = (function () {
  const {regexpPatterns, cidrPatterns, invertBypassList, proxies} = config;
  const URL = require('url-parse');
  const ip6addr = require('ip6addr');

  const hostRe = regexpPatterns.length !== 0 && new RegExp(regexpPatterns.join('|'));
  const cidrList = cidrPatterns.length !== 0 && cidrPatterns.map(pattern => ip6addr.createCIDR(pattern));

  const getIpAddr = ip => {
    const m = /^\[(.+)\]$|^([\d.]+)$/.exec(ip);
    if (m) {
      ip = m[1] || m[2];
      try {
        return ip6addr.parse(ip);
      } catch (err) {
        return null;
      }
    }
  };

  return function (url) {
    const {protocol, host, hostname} = new URL(url);

    let inBypassList = hostRe && hostRe.test(`${protocol}//${host}`);
    if (!inBypassList && cidrList) {
      const ipAddr = getIpAddr(hostname);
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