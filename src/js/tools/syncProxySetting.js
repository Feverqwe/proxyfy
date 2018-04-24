import getProxyConfig from "./getProxyConfig";
import _isEqual from "lodash.isequal";
import setProxyConfig from "./setProxyConfig";

const syncProxySetting = (settings, profile, pacScript) => {
  return Promise.resolve().then(() => {
    if (profile) {
      const config = getProxyConfig(profile, pacScript);
      if (!_isEqual(config, settings.config)) {
        return setProxyConfig(config);
      }
    }
  });
};

export default syncProxySetting;