import {useEffect, useState} from 'react';

import {RuntimeAction, hasRuntimeAction} from '../services/runtime/runtimeContract';
import {ConfigProxy, getConfig} from '../tools/index';

const useActualProxies = () => {
  const [proxies, setProxies] = useState<ConfigProxy[] | null>(null);

  useEffect(() => {
    let mounted = true;
    chrome.runtime.onMessage.addListener(listener);

    fetchState();

    function listener(message: Record<string, unknown>) {
      if (hasRuntimeAction(message, RuntimeAction.ProxiesChanged)) {
        fetchState();
      }
    }

    function fetchState() {
      getConfig()
        .then(({proxies}) => {
          if (mounted) {
            setProxies(proxies);
          }
        })
        .catch((err) => {
          console.error('Get proxies error: %O', err);
          if (mounted) {
            setProxies(null);
          }
        });
    }

    return () => {
      mounted = false;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  return proxies;
};

export default useActualProxies;
