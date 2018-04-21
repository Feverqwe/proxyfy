import {types, resolveIdentifier} from 'mobx-state-tree';
import promisifyApi from "./tools/promisifyApi";
import optionsModel from "./model/options";
import profileModel from "./model/profile";
import getProxySettings from "./tools/getProxySettings";

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
  return {
    getProfile(name) {
      return name && resolveIdentifier(profileModel, self, name);
    },
    setProfile(name) {
      // todo: set profile proxy
    },
    setOptions(options) {
      self.assign({
        options: options
      });
    },
    getProfiles() {
      return self.options.profiles.map(profile => {
        return profile.name;
      });
    },
    afterCreate() {
      promisifyApi(chrome.storage.sync.get)({
        options: {}
      }).then(storage => {
        self.assign(storage);
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
        }).then(profile => {
          response({
            profile: profile && profile.name,
            profiles: this.store.getProfiles()
          });
        });
        return true;
      }
      case 'setProfile': {
        this.store.setProfile(message.name);
        return response(true);
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