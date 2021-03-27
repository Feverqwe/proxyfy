class AuthListener {
  constructor(profile) {
    this.profile = profile;
    this.handleAuthRequired = this.handleAuthRequired.bind(this);

    this.enable();
  }
  handleAuthRequired(details) {
    const result = {};
    if (details.isProxy) {
      const m = /^([^:]+:)\/\//.exec(details.url);
      if (m) {
        const protocol = m[1];
        const proxy = this.profile.getProxyByProtocol(protocol);
        if (proxy && proxy.auth) {
          result.authCredentials = {
            username: proxy.auth.username,
            password: proxy.auth.password
          };
        }
      }
    }
    return result;
  }
  enable() {
    chrome.webRequest.onAuthRequired.addListener(this.handleAuthRequired, {urls: ["<all_urls>"]}, ['blocking']);
  }
  disable() {
    chrome.webRequest.onAuthRequired.removeListener(this.handleAuthRequired, {urls: ["<all_urls>"]}, ['blocking']);
  }
  destroy() {
    this.disable();
  }
}

export default AuthListener;