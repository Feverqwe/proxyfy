/**
 * Created by Anton on 22.01.2017.
 */
"use strict";

var escapeRegex = function (value) {
    return value.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" );
};

var urlPatternToStrRe = function(value) {
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
        host = host.replace(/\\\*/, '(?:\d+)');
    } else {
        host = host.replace(/^\\\*\\\./, '(?:[^\/]+\\.)?');
    }

    var pattern = ['^', scheme, ':\\/\\/', host];

    var path = m[3];
    if (!path || path === '*') {
        path = '(?:|\/.*)';
        pattern.push(path, '$');
    } else
    if (path) {
        path = '\/' + path;
        path = escapeRegex(path);
        path = path.replace(/\\\*/g, '.*');
        pattern.push(path, '$');
    }

    return pattern.join('');
};

var setIcon = function (active) {
    chrome.browserAction.setIcon({
        path: {
            19: active ? '/img/icon_19_a.png' : '/img/icon_19.png',
            38: active ? '/img/icon_38_a.png' : '/img/icon_38.png'
        }
    });
};

var AuthListener = function () {
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
        authListener.setProxyObj(proxyObj);

        if (!proxyObj) {
            setIcon();
            authListener.disable();
            proxyErrorListener.disable();
        } else {
            setIcon(true);
            if (proxyObj.auth) {
                authListener.enable();
            }
            proxyErrorListener.enable();
        }
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
            var rulesStrRe = storage.rules.map(function (pattern) {
                return urlPatternToStrRe(pattern);
            }).join('|');

            chrome.proxy.settings.set({
                value: {
                    mode: 'pac_script',
                    pacScript: {
                        data: '//' + JSON.stringify({proxyfy: proxyObj.name}) + '\n' + 'var FindProxyForURL;(' + function (rulesStrRe, invertRules, proxy) {
                            var re = rulesStrRe && new RegExp(rulesStrRe);
                            FindProxyForURL = function (url) {
                                var r = true;
                                if (re) {
                                    r = re.test(url);
                                    if (!invertRules) {
                                        r = !r;
                                    }
                                }
                                if (r) {
                                    return "PROXY " + proxy;
                                } else {
                                    return "DIRECT";
                                }
                            };
                        }.toString() + ')(' + [
                            rulesStrRe,
                            storage.invertRules,
                            [proxyObj.host, proxyObj.port || 80].join(':')
                        ].map(JSON.stringify).join(',') + ')'
                    }
                },
                scope: 'regular'
            }, function () {
                onProxyChange(proxyObj);
            });
        });
    };

    (function () {
        chrome.storage.sync.get({
            proxyList: []
        }, function (storage) {
            chrome.proxy.settings.get({'incognito': false}, function (details) {
                var detailsValue = details.value;

                var ruleName = null;
                try {
                    if (detailsValue.mode === 'pac_script') {
                        var m = /^\/\/(.+)\n/.exec(detailsValue.pacScript.data);
                        ruleName = m && JSON.parse(m[1]).proxyfy;
                    }
                } catch (err) {
                }

                var rule = null;

                ruleName && storage.proxyList.some(function (item) {
                    if (item.name === ruleName) {
                        rule = item;
                        return true;
                    }
                });

                onProxyChange(rule);

                chrome.runtime.onMessage.addListener(function (message) {
                    if (message.action === 'clearProxy') {
                        clearProxy();
                    } else if (message.action === 'setProxy') {
                        setProxy(message.proxyObj);
                    }
                });
            });
        });
    })();
})();