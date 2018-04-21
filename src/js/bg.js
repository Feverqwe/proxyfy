import {types, resolveIdentifier} from 'mobx-state-tree';
import promisifyApi from "./tools/promisifyApi";
import optionsModel from "./model/options";
import profileModel from "./model/profile";

const debug = require('debug')('bg');

const storeModel = types.model('store', {
  profile: types.maybe(types.string),
  options: types.maybe(optionsModel)
}).actions(self => {
  return {
    assign(obj) {
      Object.assign(self, obj);
    }
  };
}).views(self => {
  return {
    getProfile() {
      return self.profile && resolveIdentifier(profileModel, self, self.profile);
    },
    setProfile(name) {
      self.assign({
        profile: name
      });
    },
    setOptions(options) {
      self.assign({
        options: options
      });
    },
    getState() {
      return {
        profile: self.profile,
        profiles: self.options.profiles.map(profile => {
          return profile.name;
        }),
      };
    },
    afterCreate() {
      Promise.all([
        promisifyApi(chrome.storage.local.get)({
          profile: null,
        }),
        promisifyApi(chrome.storage.sync.get)({
          options: {}
        })
      ]).then(([localStorage, syncStorage]) => {
        self.assign(Object.assign({}, syncStorage, localStorage));
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
        response(this.store.getState());
        break;
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
      case 'local': {
        if (changes.profile) {
          this.store.setProfile(changes.profile.newValue);
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