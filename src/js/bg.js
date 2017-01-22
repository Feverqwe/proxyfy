/**
 * Created by Anton on 22.01.2017.
 */
require.config({
    baseUrl: 'js/',
    paths: {
        utils: './utils'
    }
});
require(['require', 'utils'], function (require) {
    var utils = require('utils');
    utils.storage.local.get({
        rules: []
    }).then(function (storage) {
        var tabs = {};
        var hostnameRe = /:\/\/(?:[^@]*@)?([^:\/]+)/;

        var rulesRe = (function () {
            return storage.rules.length && storage.rules.map(function (pattern) {
                return utils.urlPatternToStrRe(pattern);
            });
        })();

        /*chrome.webRequest.onBeforeRequest.addListener(function (details) {
            var tab = tabs[details.tabId];
            if (!tab) {
                tab = tabs[details.tabId] = {
                    hosts: []
                };
            }
            var m = hostnameRe.exec(details.url);
            if (m) {
                var hostname = m[1];
                if (tab.hosts.indexOf(hostname) === -1) {
                    tab.hosts.push(hostname);
                }
            }
        }, {urls: ["http://!*!/!*", "https://!*!/!*"]});
        chrome.tabs.onRemoved.addListener(function (tabId) {
            delete tabs[tabId];
        });*/
    });
});