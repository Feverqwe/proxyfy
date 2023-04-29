import React from 'react';
import {createRoot} from 'react-dom/client';
import {createHashHistory} from 'history';
import {Router} from 'react-router';
import {Route, Switch} from 'react-router-dom';
import Options from './components/Options/Options';
import Proxy from './components/Options/Proxy';
import Patterns from './components/Options/Patterns';
import PageBase from './components/PageBase/PageBase';

const history = createHashHistory();

const root = createRoot(document.getElementById('root')!);
root.render(
  <PageBase>
    <Router history={history}>
      <Switch>
        <Route path="/" exact={true}>
          <Options />
        </Route>
        <Route path="/proxy" exact={true}>
          <Proxy />
        </Route>
        <Route path="/patterns" exact={true}>
          <Patterns />
        </Route>
      </Switch>
    </Router>
  </PageBase>,
);
