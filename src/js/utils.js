/**
 * Created by Anton on 22.01.2017.
 */
define(function(require, exports, module) {
    var utils = {};
    utils.storage = {
        local: {
            get: function (data) {
                return new Promise(function (resolve) {
                    return chrome.storage.local.get(data, resolve);
                });
            },
            set: function (data) {
                return new Promise(function (resolve) {
                    return chrome.storage.local.set(data, resolve);
                });
            }
        },
        sync: {
            get: function (data) {
                return new Promise(function (resolve) {
                    return chrome.storage.sync.get(data, resolve);
                });
            },
            set: function (data) {
                return new Promise(function (resolve) {
                    return chrome.storage.sync.set(data, resolve);
                });
            }
        }
    };
    module.exports = utils;
});