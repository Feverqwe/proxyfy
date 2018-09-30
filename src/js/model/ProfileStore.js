import {types} from "mobx-state-tree";
import ProxyStore from "./ProxyStore";
import RuleStore from "./RuleStore";

/**
 * @typedef {{}} BadgeStore
 * @property {string} text
 * @property {*|undefined} color
 */
const BadgeStore = types.model('BadgeStore', {
  text: types.string,
  color: types.maybeNull(types.union({
    dispatcher: snapshot => {
      if (Array.isArray(snapshot)) {
        return types.array(types.number);
      } else {
        return types.string;
      }
    }
  }, types.string, types.array(types.number))),
});

/**
 * @typedef {{}} ProfileStore
 * @property {string} name
 * @property {ProxyStore|undefined} singleProxy
 * @property {ProxyStore|undefined} proxyForHttp
 * @property {ProxyStore|undefined} proxyForHttps
 * @property {ProxyStore|undefined} proxyForFtp
 * @property {ProxyStore|undefined} fallbackProxy
 * @property {string} [color]
 * @property {BadgeStore|undefined} badge
 * @property {*[]} bypassList
 * @property {boolean} [invertBypassList]
 * @property {function} hasAuth
 * @property {function} hasUnsupportedRules
 * @property {function} getBypassListRules
 * @property {function} getProxyByProtocol
 * @property {function} getPacBypassList
 * @property {function} getBypassList
 */
const ProfileStore = types.model('ProfileStore', {
  name: types.identifier,
  singleProxy: types.maybeNull(types.reference(ProxyStore)),
  proxyForHttp: types.maybeNull(types.reference(ProxyStore)),
  proxyForHttps: types.maybeNull(types.reference(ProxyStore)),
  proxyForFtp: types.maybeNull(types.reference(ProxyStore)),
  fallbackProxy: types.maybeNull(types.reference(ProxyStore)),
  color: types.optional(types.string, '#0a77e5'),
  badge: types.maybeNull(BadgeStore),
  bypassList: types.array(types.union({
    dispatcher: snapshot => {
      if (typeof snapshot === 'string') {
        return types.string;
      } else {
        return RuleStore;
      }
    },
  }, RuleStore, types.string)),
  invertBypassList: types.optional(types.boolean, false),
}).views(self => {
  return {
    hasAuth() {
      if (self.singleProxy) {
        return !!self.singleProxy.auth;
      } else {
        return ['proxyForHttp', 'proxyForHttps', 'proxyForFtp', 'fallbackProxy'].some(type => {
          const proxy = self[type];
          return proxy && proxy.auth;
        });
      }
    },
    hasUnsupportedRules() {
      return self.invertBypassList || self.getBypassListRules().some(rule => rule.parser !== 'match');
    },
    getBypassListRules() {
      return self.bypassList.map(ruleOrString => {
        let rule = ruleOrString;
        if (typeof ruleOrString === 'string') {
          rule = RuleStore.create({
            pattern: ruleOrString
          });
        }
        return rule;
      });
    },
    getProxyByProtocol(protocol) {
      let proxy = null;
      if (self.singleProxy) {
        proxy = self.singleProxy;
      } else {
        switch (protocol.toLowerCase()) {
          case 'http:':
            proxy = self.proxyForHttp;
            break;
          case 'https:':
            proxy = self.proxyForHttp;
            break;
          case 'ftp:':
            proxy = self.proxyForFtp;
            break;
        }
        if (!proxy) {
          proxy = self.fallbackProxy;
        }
      }
      return proxy;
    },
    getPacBypassList() {
      const list = [];
      self.getBypassListRules().forEach(rule => {
        list.push(...rule.getPacPatterns());
      });
      return list;
    },
    getBypassList() {
      const list = [];
      self.getBypassListRules().forEach(rule => {
        list.push(...rule.getPatterns());
      });
      return list;
    }
  }
});

export default ProfileStore;