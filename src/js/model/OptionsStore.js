import {types} from "mobx-state-tree";
import ProfileStore from "./ProfileStore";
import ProxyStore from "./ProxyStore";

/**
 * @typedef {{}} OptionsStore
 * @property {ProfileStore[]} profiles
 * @property {ProxyStore[]} proxies
 */
const OptionsStore = types.model('OptionsStore', {
  profiles: types.array(ProfileStore),
  proxies: types.array(ProxyStore),
});

export default OptionsStore;