import {useEffect, useState} from 'react';

import type {ProxyState} from '../domain/proxy/proxyState';
import {getProxyState} from '../services/runtime/runtimeClient';
import {RuntimeAction, hasRuntimeAction} from '../services/runtime/runtimeContract';

const useActualState = () => {
  const [state, setState] = useState<null | ProxyState>(null);

  useEffect(() => {
    let mounted = true;
    chrome.runtime.onMessage.addListener(listener);

    fetchState();

    function listener(message: Record<string, unknown>) {
      if (hasRuntimeAction(message, RuntimeAction.StateChanged)) {
        fetchState();
      }
    }

    function fetchState() {
      getProxyState()
        .then((state) => {
          if (mounted) {
            setState(state);
          }
        })
        .catch((err) => {
          console.error('Get proxy state error: %O', err);
          if (mounted) {
            setState(null);
          }
        });
    }

    return () => {
      mounted = false;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  return state;
};

export default useActualState;
