import React, {useCallback, useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router';
import {
  ConfigProxy,
  DefaultProxyStruct,
  getConfig,
  getObjectId,
  getRandomInt,
} from '../../../../tools/index.ts';
import {badgeColors} from './constants';
import ProxyForm from './components/ProxyForm';

const EditProxy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [proxy, setProxy] = useState<ConfigProxy | null>(null);

  const handleNewProxy = useCallback(() => {
    const newProxy = DefaultProxyStruct.create({
      color: badgeColors[getRandomInt(0, badgeColors.length)],
    }) as ConfigProxy;
    setProxy(newProxy);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const query = new URLSearchParams(location.search);

    (async () => {
      try {
        let proxy: undefined | ConfigProxy | null = null;
        if (query.has('id')) {
          const {proxies} = await getConfig();
          proxy = proxies.find((p) => p.id === query.get('id'));
        }
        if (!isMounted) return;

        if (proxy === undefined) {
          navigate('/');
        } else if (proxy === null) {
          handleNewProxy();
        } else {
          const currentProxy = DefaultProxyStruct.create(proxy) as ConfigProxy;
          setProxy(currentProxy);
        }
      } catch (err) {
        console.error('getConfig error: %O', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [location.search, navigate, handleNewProxy]);

  if (!proxy) return null;

  return <ProxyForm key={getObjectId(proxy)} proxy={proxy} onReset={handleNewProxy} />;
};

export default EditProxy;
