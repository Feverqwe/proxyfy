import {types} from "mobx-state-tree";

const proxyModel = types.model('proxy', {
  name: types.identifier(types.string),
  scheme: types.optional(types.string, 'http'),
  host: types.string,
  port: types.maybe(types.number),
  auth: types.maybe(types.model({
    username: types.string,
    password: types.string,
  })),
}).views(self => {
  const schemePort = {
    http: 80,
    https: 443,
    socks4: 1080,
    socks5: 1080,
  };

  return {
    getPacScheme() {
      switch (self.getScheme()) {
        case 'https':
          return 'HTTPS';
        case 'socks4':
          return 'SOCKS4';
        case 'socks5':
          return 'SOCKS5';
        default: {
          return 'PROXY';
        }
      }
    },
    getScheme() {
      return self.scheme.toLowerCase();
    },
    getPort() {
      return self.port || schemePort[self.getScheme()];
    },
    getUrl() {
      return [self.host, self.getPort()].join(':');
    }
  };
});

export default proxyModel;