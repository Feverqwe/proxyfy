import React from 'react';
import getConfig from '../tools/getConfig';
import {ConfigProxy} from '../tools/ConfigStruct';

const useActualProxies = () => {
  const [proxies, setProxies] = React.useState<ConfigProxy[] | null>(null);

  React.useEffect(() => {
    let mounted = true;
    chrome.runtime.onMessage.addListener(listener);

    fetchState();

    function listener(message: Record<string, unknown>) {
      if (message.action === 'proxiesChanges') {
        fetchState();
      }
    }

    function fetchState() {
      getConfig().then(({proxies}) => {
        mounted && setProxies(proxies);
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
