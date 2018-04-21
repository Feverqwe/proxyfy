/**
 * Created by Anton on 22.01.2017.
 */
import '../css/old_popup.css';

const utils = require('./utils');
const tmpl = require('./tmpl');

utils.chromeStorageSyncGet({
  proxyList: []
}).then(function (storage) {
  const proxyList = storage.proxyList;
  const switcherNode = document.querySelector('.switcher');
  const typeMenuItemMap = {};

  const onSelect = (function () {
    let lastSelectedItem = null;
    return function () {
      if (lastSelectedItem) {
        lastSelectedItem.node.classList.remove('item__selected');
      }
      this.node.classList.add('item__selected');
      lastSelectedItem = this;
    };
  })();

  const menuItems = proxyList.concat([
    {name: 'Disable', type: 'disable'},
    {name: 'Options', type: 'options'}
  ]).map(function (proxyObj, index) {
    const node = tmpl.createElement('a', {
      class: 'item',
      href: '#',
      data: {
        index: index
      },
      append: [
        tmpl.createElement('div', {
          class: 'status'
        }),
        tmpl.createElement('div', {
          class: 'name'
        }, proxyObj.name)
      ]
    });

    const itemObj = {
      node: node,
      proxyObj: proxyObj,
      select: onSelect
    };

    if (proxyObj.type) {
      typeMenuItemMap[proxyObj.type] = itemObj;
    }

    switcherNode.appendChild(node);

    return itemObj;
  });

  switcherNode.addEventListener('click', function (e) {
    e.preventDefault();
    const node = utils.closestNode(this, e.target);
    if (node) {
      const index = parseInt(node.dataset.index);
      const menuItem = menuItems[index];

      if (menuItem.proxyObj.type === 'options') {
        chrome.tabs.create({url: 'options.html'});
      } else {
        if (menuItem.proxyObj.type === 'disable') {
          chrome.runtime.sendMessage({action: 'clearProxySettings'});
        } else {
          chrome.runtime.sendMessage({action: 'setProxySettings', proxyObj: menuItem.proxyObj});
        }
        menuItem.select();
      }
    }
  });

  utils.chromeRuntimeSendMessage({action: 'getProxySettings'}).then(function (response) {
    const proxyObj = response.proxyObj;
    let menuItem = null;
    proxyObj && menuItems.some(function (item) {
      if (item.proxyObj.name === proxyObj.name) {
        menuItem = item;
        return true;
      }
    });
    if (!menuItem) {
      menuItem = typeMenuItemMap.disable;
    }
    menuItem.select();
  });
});