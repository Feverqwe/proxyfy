import React, {useEffect, useState} from 'react';

import {Alert, Box, CircularProgress} from '@mui/material';
import {useLocation, useNavigate} from 'react-router';

import {getConfigFromBackground} from '../../../../services/runtime/runtimeClient';
import {ConfigProxy} from '../../../../tools/index';
import {Header} from '../../../index';

import {PatternsLoaded} from './components/PatternsLoaded';

const Patterns = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [proxy, setProxy] = useState<ConfigProxy>();
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const query = new URLSearchParams(location.search.slice(1));
    (async () => {
      try {
        let proxy: ConfigProxy | undefined;
        if (query.has('id')) {
          const {proxies} = await getConfigFromBackground();
          proxy = proxies.find((p) => p.id === query.get('id'));
        }
        if (!proxy && isMounted) {
          navigate('/');
          return;
        }
        if (isMounted) {
          setProxy(proxy);
        }
      } catch (err) {
        console.error('getConfig error: %O', err);
        if (isMounted) setLoadError(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [location.search, navigate]);

  return (
    <>
      <Header title="Rules" />
      {loadError ? (
        <Box sx={{maxWidth: 1040, mx: 'auto', p: 2}}>
          <Alert severity="error">
            Could not load routing patterns. Return to the list and try again.
          </Alert>
        </Box>
      ) : proxy ? (
        <PatternsLoaded proxy={proxy} />
      ) : (
        <Box sx={{display: 'grid', placeItems: 'center', minHeight: 240}}>
          <CircularProgress size={28} aria-label="Loading patterns" />
        </Box>
      )}
    </>
  );
};

export default Patterns;
