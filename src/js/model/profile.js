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
    color: types.string,
  })),
  bypassList: types.optional(types.array(ruleModel), []),
  invertBypassList: types.optional(types.boolean, false),
}).views(self => {
  return {
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