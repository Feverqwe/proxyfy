import React, {useCallback, useEffect, useState} from 'react';

import {Alert, Box, CircularProgress} from '@mui/material';
import {useLocation, useNavigate} from 'react-router';

import {getConfigFromBackground} from '../../../../services/runtime/runtimeClient';
import {ConfigProxy, createDefaultProxy, getObjectId, getRandomInt} from '../../../../tools/index';
import {Header} from '../../../index';

import ProxyForm from './components/ProxyForm';
import {badgeColors} from './constants';

const EditProxy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [proxy, setProxy] = useState<ConfigProxy | null>(null);
  const [loadError, setLoadError] = useState(false);

  const handleNewProxy = useCallback(() => {
    const newProxy = createDefaultProxy({
      color: badgeColors[getRandomInt(0, badgeColors.length)],
    });
    setProxy(newProxy);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const query = new URLSearchParams(location.search);

    (async () => {
      try {
        let proxy: undefined | ConfigProxy | null = null;
        if (query.has('id')) {
          const {proxies} = await getConfigFromBackground();
          proxy = proxies.find((p) => p.id === query.get('id'));
        }
        if (!isMounted) return;

        if (proxy === undefined) {
          navigate('/');
        } else if (proxy === null) {
          handleNewProxy();
        } else {
          const currentProxy = createDefaultProxy(proxy);
          setProxy(currentProxy);
        }
      } catch (err) {
        console.error('getConfig error: %O', err);
        if (isMounted) setLoadError(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [location.search, navigate, handleNewProxy]);

  if (loadError) {
    return (
      <>
        <Header title="Connection" />
        <Box sx={{maxWidth: 1040, mx: 'auto', p: 2}}>
          <Alert severity="error">
            Could not load this connection. Return to the list and try again.
          </Alert>
        </Box>
      </>
    );
  }

  if (!proxy) {
    return (
      <Box sx={{display: 'grid', placeItems: 'center', minHeight: 240}}>
        <CircularProgress size={28} aria-label="Loading connection" />
      </Box>
    );
  }

  return <ProxyForm key={getObjectId(proxy)} proxy={proxy} onReset={handleNewProxy} />;
};

export default EditProxy;
