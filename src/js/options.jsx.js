import {types} from 'mobx-state-tree';

const ipRule = types.model('rule', {
  type: 'ip',
  netmask: types.string
});

const urlRule = types.model('rule', {
  type: 'url',
});

const proxyModel = types.model('proxy', {
  host: types.string,
  port: types.number,
  auth: types.maybe(types.model({
    username: types.string,
    password: types.string,
  })),
  rules: types.optional(types.array(types.union(snapshot => {
    switch (snapshot.type) {
      case 'ip': return ipRule;
      case 'url': return urlRule;
    }
  }, ipRule)), [])
});

const profileModel = types.model('profile', {
  name: types.string,
  color: types.string,
  badge: {
    text: types.string,
    color: types.string,
  },
  proxy: types.reference(proxyModel),
});

const storeModel = types.model('options', {
  profiles: types.optional(types.array(profileModel), []),
  proxies: types.optional(types.array(proxyModel), []),
});