import {types, getSnapshot} from 'mobx-state-tree';
import ReactDOM from 'react-dom';
import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import promisifyApi from "./tools/promisifyApi";
import {observer} from 'mobx-react';
import '../css/popup.less'

const debug = require('debug')('popup');

const storeModel = types.model('store', {
  state: types.optional(types.string, 'idle'),
  profile: types.maybe(types.string),
  profiles: types.optional(types.array(types.string), []),
}).actions(self => {
  return {
    assign(obj) {
      Object.assign(self, obj);
    }
  };
}).views(self => {
  return {
    setProfile(name) {
      self.assign({profile: name});
    },
    afterCreate() {
      self.assign({state: 'loading'});
      promisifyApi(chrome.runtime.sendMessage)({action: 'getState'}).then(state => {
        self.assign(state);
      }).catch(err => {
        debug('Load profiles error', err);
      }).then(() => {
        self.assign({state: 'done'});
      });
    }
  };
});

@observer class Popup extends React.Component {
  constructor() {
    super();

    this.handleProfileClick = this.handleProfileClick.bind(this);
    this.handleResetClick = this.handleResetClick.bind(this);
    this.handleOptionsClick = this.handleOptionsClick.bind(this);
  }
  handleProfileClick(e) {
    e.preventDefault();
    const profile = e.target.dataset.name;
    promisifyApi(chrome.runtime.sendMessage)({action: 'setProfile', name: profile}).then(() => {
      this.props.store.setProfile(profile);
    });
  }
  handleResetClick(e) {
    e.preventDefault();
    promisifyApi(chrome.runtime.sendMessage)({action: 'setProfile', name: null}).then(() => {
      this.props.store.setProfile(null);
    });
  }
  handleOptionsClick(e) {
    e.preventDefault();
    chrome.tabs.create({url: 'options.html'});
  }
  render() {
    if (this.props.store.state !== 'done') {
      return 'Loading...';
    }

    let hasActive = false;
    const buttons = [];
    this.props.store.profiles.forEach(name => {
      const classList = ['list-group-item list-group-item-action'];
      if (name === this.props.store.profile) {
        hasActive = true;
        classList.push('active');
      }
      buttons.push(
        <button key={`profile_${name}`} onClick={this.handleProfileClick} data-name={name} type="button" className={classList.join(' ')}>{name}</button>
      );
    });

    const resetBtnClassList = ['list-group-item list-group-item-action'];
    if (!hasActive) {
      resetBtnClassList.push('active');
    }
    buttons.push(
      <button key={'reset'} onClick={this.handleResetClick} type="button" className={resetBtnClassList.join(' ')}>Disable</button>
    );

    buttons.push(
      <button key={'options'} onClick={this.handleOptionsClick} type="button" className="list-group-item list-group-item-action">Options</button>
    );

    return (
      <div className="list-group list-group-flush">
        {buttons}
      </div>
    );
  }
}

export default ReactDOM.render(<Popup store={storeModel.create()}/>, document.getElementById('root'));