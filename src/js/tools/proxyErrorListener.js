class ProxyErrorListener {
  constructor() {
    this.handleProxyError = this.handleProxyError.bind(this);

    this.enable();
  }
  handleProxyError(details) {
    console.error('ProxyError', details);
  }
  enable() {
    chrome.proxy.onProxyError.addListener(this.handleProxyError);
  }
  disable() {
    chrome.proxy.onProxyError.removeListener(this.handleProxyError);
  }
  destroy() {
    this.disable();
  }
}

export default ProxyErrorListener;