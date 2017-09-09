const utils = {};

const slice = [].slice;

utils.closestNode = function (parent, someChild) {
    if (parent === someChild) {
        return null;
    }
    if (!parent.contains(someChild)) {
        return null;
    }
    let parentNode;
    while (parentNode = someChild.parentNode) {
        if (parentNode !== parent) {
            someChild = parentNode;
        } else {
            return someChild;
        }
    }
};

utils.chromeRuntimeSendMessage = function () {
    const args = slice.call(arguments);
    return new Promise(function (resolve) {
        args.push(resolve);
        chrome.runtime.sendMessage.apply(chrome.runtime, args);
    });
};

utils.chromeStorageSyncGet = function () {
    const args = slice.call(arguments);
    return new Promise(function (resolve) {
        args.push(resolve);
        chrome.storage.sync.get.apply(chrome.storage.sync, args);
    });
};

utils.chromeStorageSyncSet = function () {
    const args = slice.call(arguments);
    return new Promise(function (resolve) {
        args.push(resolve);
        chrome.storage.sync.set.apply(chrome.storage.sync, args);
    });
};

utils.chromeProxySettingsGet = function () {
    const args = slice.call(arguments);
    return new Promise(function (resolve) {
        args.push(resolve);
        chrome.proxy.settings.get.apply(chrome.proxy.settings, args);
    });
};

utils.chromeProxySettingsSet = function () {
    const args = slice.call(arguments);
    return new Promise(function (resolve) {
        args.push(resolve);
        chrome.proxy.settings.set.apply(chrome.proxy.settings, args);
    });
};

utils.chromeProxySettingsClear = function () {
    const args = slice.call(arguments);
    return new Promise(function (resolve) {
        args.push(resolve);
        chrome.proxy.settings.clear.apply(chrome.proxy.settings, args);
    });
};

utils.chromeBrowserActionGetBadgeBackgroundColor = function () {
    const args = slice.call(arguments);
    return new Promise(function (resolve) {
        args.push(resolve);
        chrome.browserAction.getBadgeBackgroundColor.apply(chrome.browserAction, args);
    });
};

utils.escapeRegex = function (value) {
    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
};

utils.urlPatternToStrRe = function (value) {
    const m = /^([^:]+):\/\/([^:\/]+)(?::(\d+))?(?:\/(.*))?$/.exec(value);
    if (!m) {
        throw new Error("Invalid url-pattern");
    }

    let scheme = m[1];
    if (scheme === '*') {
        scheme = '(?:https?)';
    } else {
        scheme = utils.escapeRegex(scheme);
    }

    let host = m[2];
    const ipParts = host.split('.');
    const isIp = ipParts.length === 4 && ipParts.every(function (item) {
        return item === '*' || /^[0-9]+$/.test(item) && item < 255;
    });

    host = utils.escapeRegex(host);

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
        path = utils.escapeRegex(path);
        path = path.replace(/\\\*/g, '.*');
        pattern.push(path, '$');
    }

    return pattern.join('');
};

module.exports = utils;