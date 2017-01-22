/**
 * Created by Anton on 22.01.2017.
 */
require.config({
    baseUrl: 'js/',
    paths: {
        dom: './dom'
    }
});

require(['require', 'dom'], function (require) {
    var dom = require('dom');

    chrome.storage.sync.get({
        proxyList: []
    }, function (storage) {
        var switcherNode = document.querySelector('.switcher');

        var proxyList = storage.proxyList.concat([
            {name: 'DISABLE', type: 'DISABLE'}
        ]).map(function (proxyObj, index) {
            var node = dom.el('a', {
                class: ['item'],
                href: '#',
                data: {
                    index: index
                },
                append: [
                    dom.el('div', {
                        class: 'status'
                    }),
                    dom.el('div', {
                        class: 'name',
                        text: proxyObj.name
                    })
                ]
            });

            switcherNode.appendChild(node);

            return {
                node: node,
                item: proxyObj
            }
        });

        switcherNode.addEventListener('click', function (e) {
            e.preventDefault();
            var node = dom.closestNode(this, e.target);
            if (node) {
                var listItem = proxyList[node.dataset.index];

                var selectedNode = switcherNode.querySelector('.item__selected');
                selectedNode.classList.remove('item__selected');

                if (listItem.item.type === 'DISABLE') {
                    chrome.runtime.sendMessage({action: 'clearProxy'});
                } else {
                    chrome.runtime.sendMessage({action: 'setProxy', details: listItem.item});
                }

                listItem.node.classList.add('item__selected');
            }
        });

        chrome.runtime.sendMessage({action: 'getProxyObj'}, function (_proxyObj) {
            var listItem = null;
            proxyList.some(function (_listItem) {
                if (_proxyObj) {
                    if (_listItem.item.name === _proxyObj.name) {
                        listItem = _listItem;
                        return true;
                    }
                } else
                if (_listItem.item.type === 'DISABLE') {
                    listItem = _listItem;
                    return true;
                }
            });
            listItem.node.classList.add('item__selected');
        });
    });
});