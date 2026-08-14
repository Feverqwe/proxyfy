import {useEffect, useState} from 'react';

import {throwIfResponseError} from '../tools/index';
import type {ProxyState} from '../types/index';

const useActualState = () => {
  const [state, setState] = useState<null | ProxyState>(null);

  useEffect(() => {
    let mounted = true;
    chrome.runtime.onMessage.addListener(listener);

    fetchState();

    function listener(message: Record<string, unknown>) {
      if (message.action === 'stateChanges') {
        fetchState();
      }
    }

    function fetchState() {
      getState()
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

async function getState() {
  const result = await chrome.runtime.sendMessage({
    action: 'get',
  });
  throwIfResponseError(result);

  if (result && typeof result === 'object' && 'mode' in result && typeof result.mode === 'string') {
    const state = result as ProxyState;
    return state;
  }

  return null;
}

export default useActualState;
