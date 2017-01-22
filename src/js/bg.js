/**
 * Created by Anton on 22.01.2017.
 */
"use strict";

var escapeRegex = function (value) {
    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
};

var urlPatternToStrRe = function (value) {
    var m = /^(\*|http|https):\/\/([^\/]+)(?:\/(.*))?$/.exec(value);
    if (!m) {
        throw new Error("Invalid url-pattern");
    }

    var scheme = m[1];
    if (scheme === '*') {
        scheme = 'https?';
    }

    var host = m[2];

    var ipParts = host.split('.');
    var isIp = ipParts.length === 4 && ipParts.every(function (item) {
        return /^(2[0-5]{2}|1?[0-9]{1,2}|\*)$/.test(item);
    });

    host = escapeRegex(host);

    if (isIp) {
        host = host.replace(/\\\*/g, '(?:\d+)');
    } else {
        host = host.replace(/^\\\*\\\./, '(?:[^\/]+\\.)?');
    }

    var pattern = ['^', scheme, ':\\/\\/', host];

    var path = m[3];
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

var AuthListener = function () {
    var self = this;
    /**
     * @typedef {Object} proxyObj
     * @property {string} name
     * @property {string} host
     * @property {number} port
     */
    var proxyObj = null;
    var onAuthRequired = function (details) {
        var result = {};
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

var ProxyErrorListener = function () {
    var onProxyError = function (details) {
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
    var authListener = new AuthListener();
    var proxyErrorListener = new ProxyErrorListener();

    var onProxyChange = function (proxyObj) {
        var iconPrefix = '/img/icon_';
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

    var clearProxy = function () {
        chrome.proxy.settings.clear({scope: 'regular'}, function () {
            onProxyChange(null);
        });
    };

    var setProxy = function (proxyObj) {
        chrome.storage.sync.get({
            proxyList: [],
            rules: [],
            invertRules: false
        }, function (storage) {
            var config = {
                mode: 'pac_script',
                pacScript: {
                    data: '//' + JSON.stringify({proxyfy: proxyObj.name}) + '\n\n' + 'var FindProxyForURL = (' + function (rulesStrRe, invertRules, proxyUrl) {
                        var re = rulesStrRe && new RegExp(rulesStrRe);
                        return function (url) {
                            var r = true;
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
                        storage.rules.map(function (pattern) {
                            return urlPatternToStrRe(pattern);
                        }).join('|'),
                        storage.invertRules,
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
        });
    };

    var getActiveProxyObj = function (callback) {
        chrome.storage.sync.get({
            proxyList: []
        }, function (storage) {
            chrome.proxy.settings.get({'incognito': false}, function (details) {
                var config = details.value;
                var proxyName = '';
                var proxyObj = null;

                if (['controlled_by_this_extension'].indexOf(details.levelOfControl) !== -1) {
                    if (config.mode === 'pac_script') {
                        try {
                            var meta = /^\/\/(.+)\n/.exec(config.pacScript.data);
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

    (function () {
        chrome.runtime.onMessage.addListener(function (message, sender, response) {
            if (message.action === 'clearProxy') {
                clearProxy();
            } else
            if (message.action === 'setProxy') {
                setProxy(message.details);
            } else
            if (message.action === 'getProxyObj') {
                getActiveProxyObj(response);
                return true;
            }
        });

        chrome.storage.onChanged.addListener(function (changes) {
            var rules = changes.rules;
            var invertRules = changes.invertRules;
            var proxyList = changes.proxyList;
            proxyList = proxyList && proxyList.newValue;

            getActiveProxyObj(function (proxyObj) {
                if (proxyObj) {
                    if (proxyList) {
                        var exists = proxyList.some(function (_proxyObj) {
                            return _proxyObj.name === proxyObj.name;
                        });
                        if (!exists) {
                            clearProxy();
                        } else {
                            setProxy(proxyObj);
                        }
                    } else
                    if (rules || invertRules) {
                        setProxy(proxyObj);
                    }
                }
            });
        });

        getActiveProxyObj(onProxyChange);
    })();
})();