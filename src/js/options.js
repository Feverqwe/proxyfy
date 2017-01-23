/**
 * Created by Anton on 22.01.2017.
 */
require.config({
    baseUrl: 'js/',
    paths: {
        dom: './dom',
        jsoneditor: '../lib/jsoneditor.min'
    }
});

require(['require', 'dom', 'jsoneditor'], function (require) {
    var dom = require('dom');
    var JSONEditor = require('jsoneditor');

    chrome.storage.sync.get({
        proxyList: []
    }, function (storage) {
        var editor = new JSONEditor(document.getElementById("jsoneditor"), {
            mode: 'code'
        });

        if (!storage.proxyList.length) {
            storage.proxyList.push({
                name: 'TEST',
                host: '127.0.0.1',
                port: 8080,
                auth: {
                    username: 'username',
                    password: 'password'
                },
                rules: [
                    '*://localhost',
                    '*://192.168.*.*',
                    '*://172.16.*.*',
                    '*://169.254.*.*',
                    '*://127.*.*.*',
                    '*://10.*.*.*'
                ],
                invertRules: false
            });
        }

        editor.set(storage);

        var save = function () {
            var storage = editor.get();
            var badRules = [];
            storage.proxyList.forEach(function (proxyObj) {
                proxyObj.rules.forEach(function (value) {
                    if (!/^(\*|http|https):\/\/([^\/]+)(?:\/(.*))?$/.exec(value)) {
                        badRules.push(JSON.stringify(value));
                    }
                });
            });
            if (badRules.length) {
                alert("Invalid rules " + badRules.join(' '));
            } else {
                chrome.storage.sync.set(storage);
            }
        };

        var saveNode = document.querySelector('.save');
        saveNode.addEventListener('click', function (e) {
            e.preventDefault();
            save();
        });

        document.addEventListener('keydown', function (e) {
            if (e.ctrlKey || e.metaKey) {
                var keyCode = e.keyCode;
                switch (keyCode) {
                    case 83:
                        e.preventDefault();
                        save();
                        break;
                }
            }
        });
    });
});