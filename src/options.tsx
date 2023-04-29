import React from 'react';
import {createRoot} from 'react-dom/client';
import {HashRouter, Route, Routes} from 'react-router-dom';
import Options from './components/Options/Options';
import Proxy from './components/Options/Proxy';
import Patterns from './components/Options/Patterns';
import PageBase from './components/PageBase/PageBase';

const root = createRoot(document.getElementById('root')!);
root.render(
  <PageBase>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Options />} />
        <Route path="/proxy" element={<Proxy />} />
        <Route path="/patterns" element={<Patterns />} />
      </Routes>
    </HashRouter>
  </PageBase>,
);
