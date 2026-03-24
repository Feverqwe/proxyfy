import {useEffect, useState} from 'react';
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
      getState().then((state) => {
        mounted && setState(state);
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

  if (result && typeof result === 'object' && 'mode' in result && typeof result.mode === 'string') {
    const state = result as ProxyState;
    return state;
  }

  return null;
}

export default useActualState;
