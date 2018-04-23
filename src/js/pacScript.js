FindProxyForURL = (function () {
  const {hostList, cidrList, invertBypassList, proxies} = init;
  const URL = require('url-parse');
  const ip6addr = require('ip6addr');

  const hostListRe = hostList.length && new RegExp(hostList.join('|'));
  const cidrObjList = cidrList.length && cidrList.map(addr => {
    return ip6addr.createCIDR(addr);
  });

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

  const containsByPassCidrList = ipAddr => {
    return cidrObjList.some(cidr => {
      return cidr.contains(ipAddr);
    });
  };

  return function (url) {
    const {protocol, host, hostname} = new URL(url);

    let inBypassList = hostListRe && hostListRe.test(protocol + '//' + host);
    if (!inBypassList) {
      const ipAddr = cidrObjList && getIpAddr(hostname);
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