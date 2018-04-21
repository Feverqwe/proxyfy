import {types} from "mobx-state-tree";
import profileModel from "./profile";
import proxyModel from "./proxy";

const optionsModel = types.model('options', {
  profiles: types.optional(types.array(profileModel), []),
  proxies: types.optional(types.array(proxyModel), []),
});

export default optionsModel;