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
        proxyList: [
            {
                name: 'TEST',
                host: '127.0.0.1',
                port: 8080,
                auth: {
                    username: 'username',
                    password: 'password'
                }
            }
        ],
        rules: [
            '192.168.*.*,',
            '172.16.*.*',
            '169.254.*.*',
            '10.*.*.*'
        ],
        invertRules: false
    }).then(function (storage) {
        var optionsNode = document.querySelector('.options');
        var saveNode = document.querySelector('.save');
        optionsNode.value = JSON.stringify(storage, null, 2);
        saveNode.addEventListener('click', function (e) {
            e.preventDefault();
            var storage = JSON.parse(optionsNode.value);
            utils.storage.sync.set(storage);
        });
    });
});

