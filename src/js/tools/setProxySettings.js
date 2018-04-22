import promisifyApi from "./promisifyApi";

const setProxySettings = profile => {
  const meta = '//' + JSON.stringify({proxyfy: profile.name});
  const regexpRules = [];
  profile.rules.forEach(rule => rule.getPatterns().forEach(pattern => {
    if (pattern.type === 'regexp') {
      regexpRules.push(pattern.pattern);
    }
  }));
  const config = {
    mode: 'pac_script',
    pacScript: {
      data: `${meta}\nvar FindProxyForURL=${function (rulesStrRe, invertRules, scheme, proxyUrl) {
        const re = rulesStrRe && new RegExp(rulesStrRe);
        return function (url) {
          let r = true;
          if (re) {
            const m = /^([^:]+:\/\/[^\/?#]+)/.exec(url);
            if (m) {
              r = re.test(m[1]); 
            }
            if (!invertRules) {
              r = !r;
            }
          }
          if (r) {
            return scheme + ' ' + proxyUrl;
          } else {
            return "DIRECT";
          }
        };
      }})(${[
        regexpRules.join('|'),
        profile.invertRules,
        profile.proxy.getScheme().toUpperCase(),
        profile.proxy.getUrl()
      ].map(JSON.stringify).join(',')});`
    }
  };
  return promisifyApi(chrome.proxy.settings.set)({
    value: config,
    scope: 'regular'
  });
};

export default setProxySettings;