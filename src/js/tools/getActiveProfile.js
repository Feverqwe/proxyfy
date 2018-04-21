import promisifyApi from "./promisifyApi";

const getActiveProfile = () => {
  return promisifyApi(chrome.proxy.settings.get)({
    incognito: false
  }).then(details => {
    const config = details.value;

    let name = null;

    if (['controlled_by_this_extension'].indexOf(details.levelOfControl) !== -1) {
      if (config.mode === 'pac_script') {
        try {
          const meta = /^\/\/(.+)\n/.exec(config.pacScript.data);
          name = meta && JSON.parse(meta[1]).proxyfy;
        } catch (err) {}
      }
    }

    return {
      name: name,
      config: config
    };
  });
};

export default getActiveProfile;