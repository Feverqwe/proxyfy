/**
 * Created by Anton on 22.01.2017.
 */
const utils = require('./utils');

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

    /**
     * @typedef {{}} ProxyObj
     * @property {string} name
     * @property {string[]} rules
     * @property {boolean} invertRules
     * @property {string} host
     * @property {string} port
     * @property {{}} auth
     * @property {string} auth.username
     * @property {string} auth.password
     */

    /**
     * @param {ProxyObj|null} proxyObj
     */
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

    /**
     * @return {Promise.<ProxyObj|null>}
     */
    const getProxySettings = function () {
        return Promise.all([
            utils.chromeStorageSyncGet({
                proxyList: []
            }),
            utils.chromeProxySettingsGet({'incognito': false})
        ]).then(function (results) {
            const proxyList = results[0];
            const details = results[1];
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
            getProxySettings().then(function (proxyObj) {
                response({proxyObj: proxyObj});
            });
            return true;
        }
    });

    chrome.storage.onChanged.addListener(function (changes) {
        const cProxyList = changes.proxyList;

        cProxyList && getProxySettings().then(function (proxyObj) {
            if (proxyObj) {
                const exists = cProxyList.newValue.some(function (_proxyObj) {
                    return _proxyObj.name === proxyObj.name;
                });
                if (!exists) {
                    return clearProxySettings();
                } else {
                    return setProxySettings(proxyObj);
                }
            }
        });
    });

    return getProxySettings().then(function (proxyObj) {
        return onProxyChange(proxyObj);
    });
})();