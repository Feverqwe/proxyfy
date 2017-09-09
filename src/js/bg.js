/**
 * Created by Anton on 22.01.2017.
 */
const utils = require('./utils');

const getIcon = function (color = '#0a77e5') {
    const body = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.613 14.682a.544.544 0 0 0-.264-.145c-.195-.043-.424.013-.75.106-.45.129-1.131.322-1.991.322-1.455 0-2.869-.57-4.206-1.69l1.548-1.546a.544.544 0 0 0-.386-.931h-1.262A1.098 1.098 0 0 1 13.205 9.7V8.44a.545.545 0 0 0-.93-.385l-1.546 1.548C8.391 6.819 9.064 4.446 9.36 3.408c.096-.337.154-.54.106-.75a.54.54 0 0 0-.145-.263A8 8 0 0 0 3.6.014a8.055 8.055 0 0 0-3.275.69.546.546 0 0 0-.186.863A8.991 8.991 0 0 1 2.141 9.96a.544.544 0 0 0 .172.557c.139.118.277.238.407.367a6.964 6.964 0 0 1 2.029 5.27c-.061 1.246-.563 2.527-1.453 3.703l-.264.349a.544.544 0 0 0 .763.763l.349-.265c1.175-.89 2.457-1.391 3.704-1.451a6.969 6.969 0 0 1 5.273 2.028c.129.13.248.268.365.405.136.16.348.227.558.174 2.915-.792 6.141-.026 8.395 2a.54.54 0 0 0 .479.129.543.543 0 0 0 .385-.313c1.345-3.04.665-6.655-1.69-8.993z" fill="' + color + '"/></svg>';
    const head = 'data:image/svg+xml;text,';
    return head + body;
};

const AuthListener = function () {
    const self = this;
    /**@type {ProxyObj|null}*/
    let proxyObj = null;

    const listener = function (details) {
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
        chrome.webRequest.onAuthRequired.addListener(listener, {urls: ["<all_urls>"]}, ['blocking']);
    };

    this.disable = function () {
        chrome.webRequest.onAuthRequired.removeListener(listener, {urls: ["<all_urls>"]}, ['blocking']);
    };

    /**
     * @param {ProxyObj} _proxyObj
     */
    this.setProxyObj = function (_proxyObj) {
        proxyObj = _proxyObj;
        if (proxyObj && proxyObj.auth) {
            self.enable();
        } else {
            self.disable();
        }
    }
};

const ProxyErrorListener = function () {
    const listener = function (details) {
        console.error('ProxyError', details);
    };

    this.enable = function () {
        chrome.proxy.onProxyError.addListener(listener);
    };

    this.disable = function () {
        chrome.proxy.onProxyError.removeListener(listener);
    };
};

(function () {
    const authListener = new AuthListener();
    const proxyErrorListener = new ProxyErrorListener();
    let defaultBadgeColor = null;

    /**
     * @typedef {{}} ProxyObj
     * @property {string} name
     * @property {string} [color]
     * @property {string[]} rules
     * @property {boolean} invertRules
     * @property {string} host
     * @property {string} port
     * @property {{}} [badge]
     * @property {string} badge.text
     * @property {string} [badge.color]
     * @property {{}} auth
     * @property {string} auth.username
     * @property {string} auth.password
     */

    /**
     * @param {ProxyObj|null} proxyObj
     */
    const onProxyChange = function (proxyObj) {
        authListener.setProxyObj(proxyObj);

        if (!proxyObj) {
            proxyErrorListener.disable();
        } else {
            proxyErrorListener.enable();
        }

        const icon = getIcon(proxyObj ? proxyObj.color : '#737373');

        chrome.browserAction.setIcon({
            path: {
                19: icon,
                38: icon
            }
        });

        Promise.resolve().then(function () {
            if (!defaultBadgeColor) {
                return utils.chromeBrowserActionGetBadgeBackgroundColor({}).then(function (color) {
                    defaultBadgeColor = color;
                });
            }
        }).then(function () {
            let badgeText = '';
            let badgeColor = defaultBadgeColor;
            const badge = proxyObj && proxyObj.badge;
            if (badge) {
                if (typeof badge.text === 'string') {
                    badgeText = badge.text;
                }
                if (typeof badge.color === 'string' || Array.isArray(badge.color)) {
                    badgeColor = badge.color;
                }
            }
            chrome.browserAction.setBadgeBackgroundColor({
                color: badgeColor
            });
            chrome.browserAction.setBadgeText({
                text: badgeText
            });
        });
    };

    const getProxyList = function () {
        return utils.chromeStorageSyncGet({
            proxyList: []
        }).then(function (storage) {
            return storage.proxyList;
        });
    };

    /**
     * @param {ProxyObj[]} proxyList
     * @return {Promise.<ProxyObj|null>}
     */
    const getProxySettings = function (proxyList) {
        return utils.chromeProxySettingsGet({'incognito': false}).then(function (details) {
            const config = details.value;
            let proxyName = '';
            let proxyObj = null;

            if (['controlled_by_this_extension'].indexOf(details.levelOfControl) !== -1) {
                if (config.mode === 'pac_script') {
                    try {
                        const meta = /^\/\/(.+)\n/.exec(config.pacScript.data);
                        proxyName = meta && JSON.parse(meta[1]).proxyfy;
                    } catch (err) {}

                    proxyName && proxyList.some(function (item) {
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

            return proxyObj;
        });
    };

    /**
     * @param {ProxyObj} proxyObj
     * @return {Promise}
     */
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
                        return utils.urlPatternToStrRe(pattern);
                    }).join('|'),
                    proxyObj.invertRules,
                    [proxyObj.host, proxyObj.port || 80].join(':')
                ].map(JSON.stringify).join(',') + ');'
            }
        };

        return utils.chromeProxySettingsSet({
            value: config,
            scope: 'regular'
        }).then(function () {
            return onProxyChange(proxyObj);
        });
    };

    /**
     * @return {Promise}
     */
    const clearProxySettings = function () {
        return utils.chromeProxySettingsClear({scope: 'regular'}).then(function () {
            return onProxyChange(null);
        });
    };

    chrome.runtime.onMessage.addListener(function (message, sender, response) {
        if (message.action === 'clearProxySettings') {
            clearProxySettings();
        } else
        if (message.action === 'setProxySettings') {
            setProxySettings(message.proxyObj);
        } else
        if (message.action === 'getProxySettings') {
            getProxyList().then(function (proxyList) {
              return getProxySettings(proxyList).then(function (proxyObj) {
                    response({proxyObj: proxyObj});
                });
            });
            return true;
        }
    });

    chrome.storage.onChanged.addListener(function (changes) {
        const proxyListChanges = changes.proxyList;
        if (proxyListChanges) {
            const oldProxyList = proxyListChanges.oldValue;
            const newProxyList = proxyListChanges.newValue;
            getProxySettings(oldProxyList).then(function (oldProxyObj) {
                if (oldProxyObj) {
                    let newProxyObj = null;

                    newProxyList.some(function (proxyObj, index) {
                        if (proxyObj.name === oldProxyObj.name) {
                            newProxyObj = proxyObj;
                            return true;
                        }
                    });

                    if (!newProxyObj) {
                        return clearProxySettings();
                    } else {
                        return setProxySettings(newProxyObj);
                    }
                }
            });
        }
    });

    return getProxyList().then(function (proxyList) {
       return getProxySettings(proxyList).then(function (proxyObj) {
           return onProxyChange(proxyObj);
       });
    });
})();