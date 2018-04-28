import promisifyApi from "./promisifyApi";

const setProxyConfig = config => {
  return promisifyApi('chrome.proxy.settings.set')({
    value: config,
    scope: 'regular'
  });
};

export default setProxyConfig;