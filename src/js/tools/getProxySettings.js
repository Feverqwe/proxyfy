import promisifyApi from "./promisifyApi";

const getProxySettings = () => {
  return promisifyApi(chrome.proxy.settings.get)({
    incognito: false
  }).then(details => {
    const value = details.value;

    let name = null;

    if (details.levelOfControl === 'controlled_by_this_extension') {
      if (value.mode === 'pac_script') {
        try {
          const meta = /^\/\/(.+)\n/.exec(value.pacScript.data);
          name = meta && JSON.parse(meta[1]).proxyfy;
        } catch (err) {}
      }
    }

    return {
      name: name,
      config: value
    };
  });
};

export default getProxySettings;