import React from 'react';

import {createRoot} from 'react-dom/client';
import {HashRouter} from 'react-router';

import Options from './components/Options/Options';
import {PageBase} from './components/index';

const root = createRoot(document.getElementById('root')!);
root.render(
  <PageBase>
    <HashRouter>
      <Options />
    </HashRouter>
  </PageBase>,
);
