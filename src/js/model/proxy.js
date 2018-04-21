import {types} from "mobx-state-tree";

const proxyModel = types.model('proxy', {
  name: types.identifier(types.string),
  host: types.string,
  port: types.number,
  auth: types.maybe(types.model({
    username: types.string,
    password: types.string,
  })),
});

export default proxyModel;