import {types, getSnapshot} from 'mobx-state-tree';
import ReactDOM from 'react-dom';
import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import promisifyApi from "./tools/promisifyApi";
import {observer} from 'mobx-react';
import 'jsoneditor/dist/jsoneditor.css';
import JSONEditor from "jsoneditor";
import '../css/options.less'
import optionsModel from "./model/options";

const debug = require('debug')('options');

const storeModel = types.model('store', {
  state: types.optional(types.string, 'idle'),
  saveState: types.optional(types.string, 'idle'),
  options: types.maybe(optionsModel),
}).actions(self => {
  return {
    assign(obj) {
      Object.assign(self, obj);
    }
  };
}).views(self => {
  return {
    async saveOptions(options) {
      if (self.saveState === 'loading') return;
      self.assign({saveState: 'loading'});
      try {
        self.assign({options: options});
        await Promise.all([
          promisifyApi(chrome.storage.sync.set)({options: options}),
          new Promise(resolve => setTimeout(resolve, 150)),
        ]);
        self.assign({saveState: 'success'});
      } catch (err) {
        debug('save error', err);
        self.assign({saveState: 'error'});
      }
    },
    afterCreate() {
      self.assign({state: 'loading'});
      promisifyApi(chrome.storage.sync.get)({
        options: {
          profiles: [{
            name: 'Profile #1',
            singleProxy: 'localProxy',
            color: '#0a77e5',
            badge: {
              text: 'test',
              color: '#0a77e5'
            },
            invertBypassList: false,
            bypassList: [{
              parser: 'match',
              pattern: '*://localhost',
            }, {
              parser: 'match',
              pattern: '*://192.168.*.*',
            }, {
              parser: 'match',
              pattern: '*://172.16.*.*',
            }, {
              parser: 'match',
              pattern: '*://169.254.*.*',
            }, {
              parser: 'match',
              pattern: '*://127.*.*.*',
            }, {
              parser: 'match',
              pattern: '*://10.*.*.*',
            }]
          }],
          proxies: [{
            name: 'localProxy',
            scheme: 'http',
            host: '127.0.0.1',
            port: 8080,
            auth: {
              username: 'username',
              password: 'password',
            }
          }]
        }
      }).then(storage => {
        self.assign(storage);
      }).catch(err => {
        debug('Load options error', err);
      }).then(() => {
        self.assign({state: 'done'});
      });
    }
  };
});

@observer class Options extends React.Component {
  constructor() {
    super();

    this.state = {
      page: 'json' // gui
    };

    this.changePage = this.changePage.bind(this);
    this.save = this.save.bind(this);
  }
  changePage(page) {
    this.setState({
      page: page
    })
  }
  save() {
    this.refs.page.save();
  }
  render() {
    let body = null;
    switch (this.props.store.state) {
      case 'loading':
        body = 'Loading...';
        break;
      case 'done':
        switch (this.state.page) {
          case 'gui':
            body = 'Coming soon...';
            break;
          case 'json':
            body = (
              <Editor ref={'page'} store={this.props.store}/>
            );
            break;
        }
        break;
    }

    return (
      <div className="container h-100">
        <Header store={this.props.store} page={this.state.page} changePage={this.changePage} onSave={this.save}/>
        {body}
      </div>
    );
  }
}

@observer class Header extends React.Component {
  constructor() {
    super();

    this.handleMenuClick = this.handleMenuClick.bind(this);
    this.handleSave = this.handleSave.bind(this);
  }
  handleMenuClick(e) {
    e.preventDefault();
    const page = e.target.dataset.page;
    this.props.changePage(page);
  }
  handleSave(e) {
    e.preventDefault();
    this.props.onSave();
  }
  render() {
    const menuItems = [];
    ['json', 'gui'].forEach(page => {
      const classList = ['nav-item'];
      if (page === this.props.page) {
        classList.push('active');
      }
      menuItems.push(
        <li key={page} className={classList.join(' ')}>
          <a onClick={this.handleMenuClick} className="nav-link" href="#" data-page={page}>{page.toUpperCase()}</a>
        </li>
      );
    });

    const saveBtnClassList = ['btn my-2 my-sm-0'];
    if (this.props.store.saveState === 'loading') {
      saveBtnClassList.push('btn-success');
    } else
    if (this.props.store.saveState === 'error') {
      saveBtnClassList.push('btn-outline-danger')
    } else {
      saveBtnClassList.push('btn-outline-success');
    }
    const saveBtn = (
        <button className={saveBtnClassList.join(' ')} type="submit">Save</button>
    );

    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand">
          <img src={require('../img/icon.svg')} width="30" height="30" alt=""/>
          {' '}
          Proxyfy
        </a>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mr-auto mt-2 mt-lg-0">
            {menuItems}
          </ul>
          <form className="form-inline my-2 my-lg-0" onSubmit={this.handleSave}>
            {saveBtn}
          </form>
        </div>
      </nav>
    );
  }
}

@observer class Editor extends React.Component {
  constructor() {
    super();

    this.refEditorWrapper = this.refEditorWrapper.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.editor = null;
  }
  componentWillMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }
  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
  handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      const keyCode = e.keyCode;
      switch (keyCode) {
        case 83:
          e.preventDefault();
          this.save();
          break;
      }
    }
  }
  refEditorWrapper(node) {
    if (!node) {
      this.editor.destroy();
    } else
    if (!this.editor) {
      this.editor = new JSONEditor(node, {
        mode: 'code'
      });
      this.editor.set(getSnapshot(this.props.store.options));
    }
  }
  save() {
    const options = this.editor.get();
    this.props.store.saveOptions(options);
  }
  render() {
    return (
      <div className="page">
        <div ref={this.refEditorWrapper} className="editor__wrapper"/>
      </div>
    );
  }
}

export default ReactDOM.render(<Options store={storeModel.create()}/>, document.getElementById('root'));