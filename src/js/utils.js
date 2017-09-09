const utils = {};

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

utils.sendMessage = function () {
    const args = [].slice.call(arguments);
    return new Promise(function (resolve) {
        args.push(resolve);
        chrome.runtime.sendMessage.apply(chrome.runtime, args);
    });
};

utils.getSyncStorage = function (data) {
    return new Promise(function (resolve) {
        chrome.storage.sync.get(data, resolve);
    });
};

module.exports = utils;