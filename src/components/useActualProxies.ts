import {useEffect, useState} from 'react';
import getConfig from '../tools/getConfig';
import {ConfigProxy} from '../tools/ConfigStruct';

const useActualProxies = () => {
  const [proxies, setProxies] = useState<ConfigProxy[] | null>(null);

  useEffect(() => {
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
