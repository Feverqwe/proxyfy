import {types} from "mobx-state-tree";
import isIp6 from "../tools/isIp6";

/**
 * @typedef {{}} ProxyStore
 * @property {string} name
 * @property {string} [scheme]
 * @property {string} host
 * @property {number|undefined} port
 * @property {{username:string,password:string}|undefined} auth
 * @property {function} getPacScheme
 * @property {function} getScheme
 * @property {function} getPort
 * @property {function} getPacHost
 * @property {function} getPacUrl
 */
const ProxyStore = types.model('ProxyStore', {
  name: types.identifier,
  scheme: types.optional(types.string, 'http'),
  host: types.string,
  port: types.maybeNull(types.number),
  auth: types.maybeNull(types.model({
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
        case 'socks':
        case 'socks4':
          return 'SOCKS';
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
    getPacHost() {
      if (isIp6(self.host)) {
        return `[${self.host}]`;
      } else {
        return self.host;
      }
    },
    getPacUrl() {
      return [self.getPacHost(), self.getPort()].join(':');
    }
  };
});

export default ProxyStore;