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
    utils.escapeRegex = function (value) {
        return value.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" );
    };
    utils.urlPatternToStrRe = function(value) {
        var m = /^(\*|http|https):\/\/([^\/]+)(?:\/(.*))?$/.exec(value);
        if (!m) {
            throw new Error("Invalid url-pattern");
        }

        var scheme = m[1];
        if (scheme === '*') {
            scheme = 'https?';
        }

        var host = m[2];
        host = utils.escapeRegex(host);

        var ipParts = host.split('.');
        var isIp = ipParts.length === 4 && ipParts.every(function (item) {
            return /^(2[0-5][0-5]|1?[0-9]?[0-9])$/.test(item);
        });

        if (isIp) {
            host = host.replace(/\\\*/, '(?:\d+)');
        } else {
            host = host.replace(/^\\\*\\\./, '(?:[^\/]+\\.)?');
        }

        var pattern = ['^', scheme, ':\\/\\/', host];

        var path = m[3];
        if (!path) {
            pattern.push('$');
        } else
        if (path === '*') {
            path = '(?:|\/.*)';
            pattern.push(path, '$');
        } else
        if (path) {
            path = '\/' + path;
            path = utils.escapeRegex(path);
            path = path.replace(/\\\*/g, '.*');
            pattern.push(path, '$');
        }

        return pattern.join('');
    };
    module.exports = utils;
});