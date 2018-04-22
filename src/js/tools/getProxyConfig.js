const debug = require('debug')('getProxyConfig');

const getProxyConfig = profile => {
  const meta = '//' + JSON.stringify({proxyfy: profile.name});
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
      data: `${meta}\nvar FindProxyForURL=(${function (bypassListRe, invertBypassList, proxyScheme, proxyUrl) {
        const bypassList = bypassListRe && new RegExp(bypassListRe);
        return function (url) {
          let r = true;
          if (bypassList) {
            const m = /^([^:]+:\/\/[^\/?#]+)/.exec(url);
            if (m) {
              r = !bypassList.test(m[1]);
            }
            if (invertBypassList) {
              r = !r;
            }
          }
          if (r) {
            return proxyScheme + ' ' + proxyUrl;
          } else {
            return "DIRECT";
          }
        };
      }})(${[
        bypassListRe.join('|'),
        profile.invertBypassList,
        profile.singleProxy.getPacScheme(),
        profile.singleProxy.getUrl()
      ].map(JSON.stringify).join(',')});`
    }
  };
  return config;
};

export default getProxyConfig;