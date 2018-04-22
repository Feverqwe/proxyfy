import {types} from "mobx-state-tree";
import proxyModel from "./proxy";
import ruleModel from "./rule";

const profileModel = types.model('profile', {
  name: types.identifier(types.string),
  singleProxy: types.maybe(types.reference(proxyModel)),
  proxyForHttp: types.maybe(types.reference(proxyModel)),
  proxyForHttps: types.maybe(types.reference(proxyModel)),
  proxyForFtp: types.maybe(types.reference(proxyModel)),
  fallbackProxy: types.maybe(types.reference(proxyModel)),
  color: types.string,
  badge: types.maybe(types.model('badge', {
    text: types.string,
    color: types.maybe(types.union(snapshot => {
      if (Array.isArray(snapshot)) {
        return types.array(types.number);
      } else {
        return types.string;
      }
    }, types.string, types.array(types.number))),
  })),
  bypassList: types.optional(types.array(ruleModel), []),
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
    getProxyByProtocol(protocol) {
      let proxy = null;
      if (self.singleProxy) {
        proxy = self.singleProxy;
      } else {
        switch (protocol) {
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
    getBypassList() {
      const list = [];
      self.bypassList.forEach(rule => {
        list.push(...rule.getPatterns());
      });
      return list;
    },
  }
});

export default profileModel;