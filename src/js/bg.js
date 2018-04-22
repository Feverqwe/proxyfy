import {types, resolveIdentifier} from 'mobx-state-tree';
import promisifyApi from "./tools/promisifyApi";
import optionsModel from "./model/options";
import profileModel from "./model/profile";
import getProxySettings from "./tools/getProxySettings";
import setProxyConfig from "./tools/setProxyConfig";
import AuthListener from "./tools/authListener";
import ProxyErrorListener from "./tools/proxyErrorListener";
import getExtensionIcon from "./tools/getExtensionIcon";
import getProxyConfig from "./tools/getProxyConfig";

const debug = require('debug')('bg');

const storeModel = types.model('store', {
  options: types.maybe(optionsModel)
}).actions(self => {
  return {
    assign(obj) {
      Object.assign(self, obj);
    }
  };
}).views(self => {
  let ip6addrRoll = null;
  let urlRoll = null;
  let defaultBadgeColor = null;
  let proxyErrorListener = null;
  let authListener = null;

  const onProxyChange = profile => {
    if (proxyErrorListener) {
      proxyErrorListener.destroy();
      proxyErrorListener = null;
    }

    if (profile) {
      proxyErrorListener = new ProxyErrorListener();
    }

    if (authListener) {
      authListener.destroy();
      authListener = null;
    }

    if (profile && profile.hasAuth()) {
      authListener = new AuthListener(profile);
    }

    const icon = getExtensionIcon(profile ? profile.color : '#737373');
    chrome.browserAction.setIcon({
      path: {
        19: icon,
        38: icon
      }
    });

    let badgeText = '';
    let badgeColor = defaultBadgeColor;
    if (profile) {
      const badge = profile.badge;
      if (badge) {
        if (typeof badge.text === 'string') {
          badgeText = badge.text;
        }
        if (typeof badge.color === 'string' || Array.isArray(badge.color)) {
          badgeColor = badge.color;
        }
      }
    }
    chrome.browserAction.setBadgeBackgroundColor({
      color: badgeColor
    });
    chrome.browserAction.setBadgeText({
      text: badgeText
    });
  };

  const syncProxySetting = (settings, profile) => {
    return Promise.resolve().then(() => {
      if (profile) {
        const config = getProxyConfig(profile, urlRoll, ip6addrRoll);
        if (
          config.mode !== settings.config.mode ||
          config.pacScript.data !== settings.config.pacScript.data
        ) {
          return setProxyConfig(config);
        }
      }
    });
  };

  return {
    getProfile(name) {
      return name && resolveIdentifier(profileModel, self, name);
    },
    setProfile(name) {
      const profile = self.getProfile(name);
      return Promise.resolve().then(() => {
        if (profile) {
          return setProxyConfig(getProxyConfig(profile, urlRoll, ip6addrRoll));
        } else {
          return promisifyApi(chrome.proxy.settings.clear)({scope: 'regular'});
        }
      }).then(() => {
        return onProxyChange(profile);
      });
    },
    setOptions(options) {
      self.assign({
        options: options
      });

      return getProxySettings().then(settings => {
        const profile = self.getProfile(settings.name);
        return syncProxySetting(settings, profile).then(() => {
          return onProxyChange(profile);
        });
      });
    },
    getProfiles() {
      return self.options.profiles.map(profile => {
        return profile.name;
      });
    },
    afterCreate() {
      return Promise.all([
        fetch('./js/ip6addrRoll.js').then(response => response.text()).then(text => {
          ip6addrRoll = text.replace(/[^\x00-\x7F]/g, '');
        }),
        fetch('./js/urlRoll.js').then(response => response.text()).then(text => {
          urlRoll = text.replace(/[^\x00-\x7F]/g, '');
        }),
      ]).then(() => {
        return promisifyApi(chrome.browserAction.getBadgeBackgroundColor)({}).then(color => {
          defaultBadgeColor = color;
        });
      }).then(() => {
        return promisifyApi(chrome.storage.sync.get)({
          options: {}
        });
      }).then(storage => {
        return self.setOptions(storage.options);
      }).catch(err => {
        debug('Load error', err);
      });
    }
  };
});

class Bg {
  constructor() {
    this.store = storeModel.create();

    this.handleMessage = this.handleMessage.bind(this);
    this.handleStorageChanged = this.handleStorageChanged.bind(this);

    this.init();
  }
  handleMessage(message, sender, response) {
    switch (message.action) {
      case 'getState': {
        getProxySettings().catch(err => {
          debug('getActiveProfile error', err);
          return null;
        }).then(settings => {
          response({
            profile: settings && settings.name,
            profiles: this.store.getProfiles()
          });
        });
        return true;
      }
      case 'setProfile': {
        this.store.setProfile(message.name).then(() => {
          response(true);
        });
        return true;
      }
    }
  }
  handleStorageChanged(changes, areaName) {
    switch (areaName) {
      case 'sync': {
        if (changes.options) {
          this.store.setOptions(changes.options.newValue);
        }
        break;
      }
    }
  }
  init() {
    chrome.runtime.onMessage.addListener(this.handleMessage);
    chrome.storage.onChanged.addListener(this.handleStorageChanged);
  }
}

const bg = new Bg();

export default bg;