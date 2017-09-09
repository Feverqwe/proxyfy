/**
 * Created by Anton on 22.01.2017.
 */
"use strict";

const escapeRegex = function (value) {
    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
};

const urlPatternToStrRe = function (value) {
    const m = /^([^:]+):\/\/([^:\/]+)(?::(\d+))?(?:\/(.*))?$/.exec(value);
    if (!m) {
        throw new Error("Invalid url-pattern");
    }

    let scheme = m[1];
    if (scheme === '*') {
        scheme = '(?:https?)';
    }

    let host = m[2];
    const ipParts = host.split('.');
    const isIp = ipParts.length === 4 && ipParts.every(function (item) {
        return item === '*' || /^[0-9]+$/.test(item) && item < 255;
    });

    host = escapeRegex(host);

    if (isIp) {
        host = host.replace(/\\\*/g, '(?:\d+)');
    } else {
        host = host.replace(/^\\\*\\\./, '(?:[^\/]+\\.)?');
    }

    const pattern = ['^', scheme, ':\\/\\/', host];

    const port = m[3];
    if (port) {
        pattern.push(':' + port);
    }

    let path = m[4];
    if (!path || path === '*') {
        path = '(?:|\/.*)';
        pattern.push(path, '$');
    } else if (path) {
        path = '\/' + path;
        path = escapeRegex(path);
        path = path.replace(/\\\*/g, '.*');
        pattern.push(path, '$');
    }

    return pattern.join('');
};

const AuthListener = function () {
    const self = this;
    /**
     * @typedef {Object} proxyObj
     * @property {string} name
     * @property {string} host
     * @property {number} port
     */
    let proxyObj = null;
    const onAuthRequired = function (details) {
        const result = {};
        if (details.isProxy && proxyObj && proxyObj.auth) {
            result.authCredentials = {
                username: proxyObj.auth.username,
                password: proxyObj.auth.password
            };
        }
        return result;
    };

    this.enable = function () {
        chrome.webRequest.onAuthRequired.addListener(onAuthRequired, {urls: ["<all_urls>"]}, ['blocking']);
    };

    this.disable = function () {
        chrome.webRequest.onAuthRequired.removeListener(onAuthRequired, {urls: ["<all_urls>"]}, ['blocking']);
    };

    this.setProxyObj = function (obj) {
        proxyObj = obj;
        if (proxyObj && proxyObj.auth) {
            self.enable();
        } else {
            self.disable();
        }
    }
};

const ProxyErrorListener = function () {
    const onProxyError = function (details) {
        console.error('ProxyError', details);
    };

    this.enable = function () {
        chrome.proxy.onProxyError.addListener(onProxyError);
    };

    this.disable = function () {
        chrome.proxy.onProxyError.removeListener(onProxyError);
    };
};

(function () {
    const authListener = new AuthListener();
    const proxyErrorListener = new ProxyErrorListener();

    const onProxyChange = function (proxyObj) {
        let iconPrefix = '/img/icon_';
        authListener.setProxyObj(proxyObj);

        if (!proxyObj) {
            proxyErrorListener.disable();
        } else {
            proxyErrorListener.enable();
            iconPrefix += 'a_';
        }

        chrome.browserAction.setIcon({
            path: {
                19: iconPrefix + '19.png',
                38: iconPrefix + '38.png'
            }
        });
    };

    const getProxySettings = function (callback) {
        chrome.storage.sync.get({
            proxyList: []
        }, function (storage) {
            chrome.proxy.settings.get({'incognito': false}, function (details) {
                const config = details.value;
                let proxyName = '';
                let proxyObj = null;

                if (['controlled_by_this_extension'].indexOf(details.levelOfControl) !== -1) {
                    if (config.mode === 'pac_script') {
                        try {
                            const meta = /^\/\/(.+)\n/.exec(config.pacScript.data);
                            proxyName = meta && JSON.parse(meta[1]).proxyfy;
                        } catch (err) {
                        }

                        proxyName && storage.proxyList.some(function (item) {
                            if (item.name === proxyName) {
                                proxyObj = item;
                                return true;
                            }
                        });
                    }
                }

                if (proxyName && !proxyObj) {
                    proxyObj = {name: proxyName, lost: true};
                }

                callback(proxyObj);
            });
        });
    };

    const setProxySettings = function (proxyObj) {
        const meta = '//' + JSON.stringify({proxyfy: proxyObj.name}) + '\n';
        const config = {
            mode: 'pac_script',
            pacScript: {
                data: meta + 'var FindProxyForURL=(' + function (rulesStrRe, invertRules, proxyUrl) {
                    const re = rulesStrRe && new RegExp(rulesStrRe);
                    return function (url) {
                        let r = true;
                        if (re) {
                            r = re.test(url);
                            if (!invertRules) {
                                r = !r;
                            }
                        }
                        if (r) {
                            return "PROXY " + proxyUrl;
                        } else {
                            return "DIRECT";
                        }
                    };
                }.toString() + ')(' + [
                    proxyObj.rules.map(function (pattern) {
                        return urlPatternToStrRe(pattern);
                    }).join('|'),
                    proxyObj.invertRules,
                    [proxyObj.host, proxyObj.port || 80].join(':')
                ].map(JSON.stringify).join(',') + ');'
            }
        };

        chrome.proxy.settings.set({
            value: config,
            scope: 'regular'
        }, function () {
            onProxyChange(proxyObj);
        });
    };

    const clearProxySettings = function () {
        chrome.proxy.settings.clear({scope: 'regular'}, function () {
            onProxyChange(null);
        });
    };

    (function () {
        chrome.runtime.onMessage.addListener(function (message, sender, response) {
            if (message.action === 'clearProxySettings') {
                clearProxySettings();
            } else
            if (message.action === 'setProxySettings') {
                setProxySettings(message.proxyObj);
            } else
            if (message.action === 'getProxySettings') {
                getProxySettings(function (proxyObj) {
                    response({proxyObj: proxyObj});
                });
                return true;
            }
        });

        chrome.storage.onChanged.addListener(function (changes) {
            const cProxyList = changes.proxyList;

            cProxyList && getProxySettings(function (proxyObj) {
                if (proxyObj) {
                    const exists = cProxyList.newValue.some(function (_proxyObj) {
                        return _proxyObj.name === proxyObj.name;
                    });
                    if (!exists) {
                        clearProxySettings();
                    } else {
                        setProxySettings(proxyObj);
                    }
                }
            });
        });

        getProxySettings(onProxyChange);
    })();
})();