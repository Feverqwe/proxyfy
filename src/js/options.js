/**
 * Created by Anton on 22.01.2017.
 */
const JSONEditor = require('../lib/jsoneditor.min');

chrome.storage.sync.get({
    proxyList: []
}, function (storage) {
    const editor = new JSONEditor(document.getElementById("jsoneditor"), {
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

    const save = function () {
        const storage = editor.get();
        const badRules = [];
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

    const saveNode = document.querySelector('.save');
    saveNode.addEventListener('click', function (e) {
        e.preventDefault();
        save();
    });

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey) {
            const keyCode = e.keyCode;
            switch (keyCode) {
                case 83:
                    e.preventDefault();
                    save();
                    break;
            }
        }
    });
});