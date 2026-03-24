import React from 'react';
import {createRoot} from 'react-dom/client';
import {HashRouter, Route, Routes} from 'react-router-dom';
import ProxyList from './components/Options/components/ProxyList/ProxyList';
import EditProxy from './components/Options/components/EditProxy/EditProxy';
import Patterns from './components/Options/components/Patterns/Patterns';
import StorageSettings from './components/Options/components/StorageSettings/StorageSettings';
import PageBase from './components/PageBase/PageBase';

const root = createRoot(document.getElementById('root')!);
root.render(
  <PageBase>
    <HashRouter>
      <Routes>
        <Route path="/" element={<ProxyList />} />
        <Route path="/proxy" element={<EditProxy />} />
        <Route path="/patterns" element={<Patterns />} />
        <Route path="/storage" element={<StorageSettings />} />
      </Routes>
    </HashRouter>
  </PageBase>,
);
