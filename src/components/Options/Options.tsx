import React from 'react';

import {Route, Routes} from 'react-router';

import EditProxy from './components/EditProxy/EditProxy';
import {Patterns} from './components/Patterns/index';
import ProxyList from './components/ProxyList/ProxyList';
import StorageSettings from './components/StorageSettings/StorageSettings';

const Options = () => {
  return (
    <Routes>
      <Route path="/" element={<ProxyList />} />
      <Route path="/proxy" element={<EditProxy />} />
      <Route path="/patterns" element={<Patterns />} />
      <Route path="/storage" element={<StorageSettings />} />
    </Routes>
  );
};

export default Options;
