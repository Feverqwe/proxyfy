import {types} from "mobx-state-tree";
import proxyModel from "./proxy";
import ruleModel from "./rule";

const profileModel = types.model('profile', {
  name: types.identifier(types.string),
  proxy: types.reference(proxyModel),
  color: types.string,
  badge: types.maybe(types.model('badge', {
    text: types.string,
    color: types.string,
  })),
  rules: types.optional(types.array(ruleModel), []),
  invertRules: types.optional(types.boolean, false),
});

export default profileModel;