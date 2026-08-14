import React from 'react';

import {createRoot} from 'react-dom/client';

import {PageBase, Popup} from './components/index';

const root = createRoot(document.getElementById('root')!);
root.render(
  <PageBase>
    <Popup />
  </PageBase>,
);
