import * as React from "react";
import getConfig from "../tools/getConfig";
import {Proxy} from "../tools/ConfigStruct";

const useActualProxies = () => {
  const [proxies, setProxies] = React.useState<Proxy[] | null>(null);

  React.useEffect(() => {
    let mounted = true;
    chrome.runtime.onMessage.addListener(listener);

    fetchState();

    function listener(message: Record<string, any>) {
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
