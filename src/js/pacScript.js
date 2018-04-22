FindProxyForURL = (function () {
  const {bypassListRe, cidrList, invertBypassList, proxies} = init;
  const URL = require('url-parse');
  const ip6addr = require('ip6addr');

  const bypassList = bypassListRe && new RegExp(bypassListRe);
  const notEmptyCidrList = cidrList.length;
  const cidrObjList = cidrList.map(addr => {
    return ip6addr.createCIDR(addr);
  });

  const getIpAddr = hostname => {
    if (/^\[.+\]$|^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(hostname)) {
      const m = /^\[(.+)\]$/.exec(hostname);
      if (m) {
        hostname = m[1];
      }
      try {
        return ip6addr.parse(hostname);
      } catch (err) {
        return null;
      }
    }
  };

  const containsByPassCidrList = ipAddr => {
    return cidrObjList.some(cidr => {
      return cidr.contains(ipAddr);
    });
  };

  return function (url) {
    const {protocol, host, hostname} = new URL(url);

    let inBypassList = bypassList && bypassList.test(protocol + '//' + host);
    if (!inBypassList) {
      const ipAddr = notEmptyCidrList && getIpAddr(hostname);
      if (ipAddr) {
        inBypassList = containsByPassCidrList(ipAddr);
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
      return proxy.scheme + ' ' + proxy.url;
    } else {
      return "DIRECT";
    }
  };
})();