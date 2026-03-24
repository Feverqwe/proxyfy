import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {ConfigProxy, getConfig} from '../../../../tools/index';
import {Header} from '../../../index';
import {PatternsLoaded} from './components/PatternsLoaded';

const Patterns = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [proxy, setProxy] = useState<ConfigProxy>();

  useEffect(() => {
    let isMounted = true;

    const query = new URLSearchParams(location.search.slice(1));
    (async () => {
      try {
        let proxy: ConfigProxy | undefined;
        if (query.has('id')) {
          const {proxies} = await getConfig();
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
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [location.search, navigate]);

  return (
    <>
      <Header title="Patterns" />
      {proxy ? <PatternsLoaded proxy={proxy} /> : null}
    </>
  );
};

export default Patterns;
