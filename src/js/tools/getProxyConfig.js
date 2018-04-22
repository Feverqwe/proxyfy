const debug = require('debug')('getProxyConfig');

const getProxyConfig = (profile, rolls) => {
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

  const bypassListRe = [];
  const cidrList = [];
  profile.getBypassList().forEach(rule => {
    if (rule.type === 'regexp') {
      bypassListRe.push(rule.pattern);
    } else
    if (rule.type === 'CIDR') {
      cidrList.push({
        ipRange: rule.pattern
      });
    } else {
      debug('Skip rule', rule);
    }
  });

  const config = {
    mode: 'pac_script',
    pacScript: {
      data: `${meta}\nvar URL = null;\nvar ip6addr = null;\n${rolls}\nvar FindProxyForURL=(${function (bypassListRe, cidrList, invertBypassList, proxies) {
        const bypassList = bypassListRe && new RegExp(bypassListRe);
        const notEmptyCidrList = cidrList.length;
        
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
          return cidrList.some(item => {
            if (!item.cidr) {
              item.cidr = ip6addr.createCIDR(item.ipRange);
            }
            return item.cidr.contains(ipAddr);
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
      }})(${[
        bypassListRe.join('|'),
        cidrList,
        profile.invertBypassList,
        proxies
      ].map(JSON.stringify).join(',')});`
    }
  };

  // debug('bypassListRe', bypassListRe);
  // debug('cidrList', cidrList);

  return config;
};

export default getProxyConfig;