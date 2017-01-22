/**
 * Created by Anton on 22.01.2017.
 */
require.config({
    baseUrl: 'js/',
    paths: {
        utils: './utils',
        dom: './dom'
    }
});

require(['require', 'utils', 'dom'], function (require) {
    var utils = require('utils');
    var dom = require('dom');

    utils.storage.sync.get({
        proxyList: [],
        rules: [],
        invertRules: false
    }).then(function (storage) {
        (function () {
            var switcherNode = document.querySelector('.switcher');

            storage.proxyList.forEach(function (proxyObj, index) {
                switcherNode.appendChild(dom.el('a', {
                    href: '#index',
                    data: {
                        index: index
                    },
                    text: proxyObj.name
                }));
            });
            switcherNode.appendChild(dom.el('a', {
                href: '#direct',
                data: {
                    index: -1
                },
                text: 'DISABLE'
            }));
            switcherNode.addEventListener('click', function (e) {
                e.preventDefault();
                var node = dom.closestNode(this, e.target);
                var index = node.dataset.index;
                localStorage.currentProxy = '';
                if (index < 0) {
                    chrome.runtime.sendMessage({action: 'clearProxy'});
                } else {
                    chrome.runtime.sendMessage({action: 'setProxy', proxyObj: storage.proxyList[index]});
                }
            });
        })();
    });
});