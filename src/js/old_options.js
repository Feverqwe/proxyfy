/**
 * Created by Anton on 22.01.2017.
 */
import '../css/options.css';
import 'jsoneditor/dist/jsoneditor.css';
import JSONEditor from 'jsoneditor';

const utils = require('./utils');

utils.chromeStorageSyncGet({
  proxyList: []
}).then(function (storage) {
  const editor = new JSONEditor(document.getElementById("jsoneditor"), {
    mode: 'code'
  });

  if (!storage.proxyList.length) {
    storage.proxyList.push({
      name: 'TEST',
      color: "#0a77e5",
      badge: {
        text: 'test',
        color: '#0a77e5'
      },
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

  /**
   * @return {Promise}
   */
  const save = function () {
    return Promise.resolve().then(function () {
      const storage = editor.get();
      const badRules = [];
      storage.proxyList.forEach(function (/*ProxyObj*/proxyObj) {
        proxyObj.rules.forEach(function (value) {
          try {
            utils.urlPatternToStrRe(value);
          } catch (err) {
            badRules.push(JSON.stringify(value));
          }
        });
      });

      if (badRules.length) {
        const err = new Error('Invalid rules ' + badRules.join(' '));
        err.rules = badRules;
        throw err;
      }

      return utils.chromeStorageSyncSet(storage);
    });
  };

  const saveNode = document.querySelector('.save');
  saveNode.addEventListener('click', function (e) {
    e.preventDefault();
    save().catch(function (err) {
      console.error('Save error', err);
      alert('Save error (see more in console): ' + err.message);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
      const keyCode = e.keyCode;
      switch (keyCode) {
        case 83:
          e.preventDefault();
          saveNode.dispatchEvent(new MouseEvent('click'));
          break;
      }
    }
  });
});