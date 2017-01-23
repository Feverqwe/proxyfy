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

        var typeItems = {};

        var menuItems = storage.proxyList.concat([
            {name: 'Disable', type: 'disable'},
            {name: 'Options', type: 'options'}
        ]).map(function (item, index) {
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
                        text: item.name
                    })
                ]
            });

            var itemObj = {
                node: node,
                item: item
            };

            if (item.type) {
                typeItems[item.type] = itemObj;
            }

            switcherNode.appendChild(node);

            return itemObj;
        });

        switcherNode.addEventListener('click', function (e) {
            e.preventDefault();
            var node = dom.closestNode(this, e.target);
            if (node) {
                var itemObj = menuItems[node.dataset.index];

                if (itemObj.item.type === 'options') {
                    chrome.tabs.create({url: 'options.html'});
                } else {
                    if (itemObj.item.type === 'disable') {
                        chrome.runtime.sendMessage({action: 'clearProxy'});
                    } else {
                        chrome.runtime.sendMessage({action: 'setProxy', details: itemObj.item});
                    }

                    var selectedNode = switcherNode.querySelector('.item__selected');
                    selectedNode.classList.remove('item__selected');
                    itemObj.node.classList.add('item__selected');
                }
            }
        });

        chrome.runtime.sendMessage({action: 'getProxyObj'}, function (item) {
            var itemObj = null;
            menuItems.some(function (_itemObj) {
                if (item && _itemObj.item.name === item.name) {
                    itemObj = _itemObj;
                    return true;
                }
            });
            if (!itemObj) {
                itemObj = typeItems.disable;
            }
            itemObj.node.classList.add('item__selected');
        });
    });
});