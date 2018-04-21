import promisifyApi from "./promisifyApi";

const setProxySettings = profile => {
  const meta = '//' + JSON.stringify({proxyfy: profile.name});
  const config = {
    mode: 'pac_script',
    pacScript: {
      data: `${meta}\nvar FindProxyForURL=${function (rulesStrRe, invertRules, proxyUrl) {
        const re = rulesStrRe && new RegExp(rulesStrRe);
        return function (url) {
          let r = true;
          if (re) {
            r = re.test(url);
            if (invertRules) {
              r = !r;
            }
          }
          if (r) {
            return "PROXY " + proxyUrl;
          } else {
            return "DIRECT";
          }
        };
      }})(${[
        profile.rules.map(rule => rule.getPattern()).join('|'),
        profile.invertRules,
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