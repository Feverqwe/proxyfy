/**
 * Created by Anton on 22.01.2017.
 */
"use strict";
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

        var typeMenuItems = {};

        var onSelect = (function () {
            var lastSelectedItem = null;
            return function () {
                if (lastSelectedItem) {
                    lastSelectedItem.node.classList.remove('item__selected');
                }
                this.node.classList.add('item__selected');
                lastSelectedItem = this;
            };
        })();

        var menuItems = storage.proxyList.concat([
            {name: 'Disable', type: 'disable'},
            {name: 'Options', type: 'options'}
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

            var itemObj = {
                node: node,
                proxyObj: proxyObj,
                select: onSelect
            };

            if (proxyObj.type) {
                typeMenuItems[proxyObj.type] = itemObj;
            }

            switcherNode.appendChild(node);

            return itemObj;
        });

        switcherNode.addEventListener('click', function (e) {
            e.preventDefault();
            var node = dom.closestNode(this, e.target);
            if (node) {
                var menuItem = menuItems[node.dataset.index];

                if (menuItem.proxyObj.type === 'options') {
                    chrome.tabs.create({url: 'options.html'});
                } else {
                    if (menuItem.proxyObj.type === 'disable') {
                        chrome.runtime.sendMessage({action: 'clearProxy'});
                    } else {
                        chrome.runtime.sendMessage({action: 'setProxyObj', proxyObj: menuItem.proxyObj});
                    }
                    menuItem.select();
                }
            }
        });

        chrome.runtime.sendMessage({action: 'getProxyObj'}, function (response) {
            var proxyObj = response.proxyObj;
            var menuItem = null;
            proxyObj && menuItems.some(function (item) {
                if (item.proxyObj.name === proxyObj.name) {
                    menuItem = item;
                    return true;
                }
            });
            if (!menuItem) {
                menuItem = typeMenuItems.disable;
            }
            menuItem.select();
        });
    });
});