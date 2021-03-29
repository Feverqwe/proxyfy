import {GenericProxy, Proxy} from "./ConfigStruct";

class AuthListener {
  destroyed = false;
  public readonly isRequired: boolean;
  private proxies: GenericProxy[];

  constructor(proxies: Proxy[]) {
    this.proxies = proxies.filter(proxy => proxy.type !== 'direct' && !!proxy.username) as GenericProxy[];
    this.isRequired = !!this.proxies.length;
  }

  handleAuthRequired = (details: { isProxy: boolean, url: string, challenger: {host: string, port: number} }) => {
    const result: { authCredentials?: { username: string, password: string } } = {};
    if (details.isProxy && details.challenger) {
      const proxy = this.proxies.find((proxy) => {
        return details.challenger.host === proxy.host
          && details.challenger.port === proxy.port;
      });
      if (proxy) {
        result.authCredentials = {
          username: proxy.username!,
          password: proxy.password!,
        };
      }
    }
    return result;
  }

  enable() {
    if (!this.isRequired) return;
    chrome.webRequest.onAuthRequired.addListener(this.handleAuthRequired, {urls: ["<all_urls>"]}, ['blocking']);
  }

  disable() {
    chrome.webRequest.onAuthRequired.removeListener(this.handleAuthRequired);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    this.disable();
  }
}

export default AuthListener;
