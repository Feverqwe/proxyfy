import {useEffect, useState} from 'react';

const useActualState = () => {
  const [state, setState] = useState<null | {mode: string; id?: string}>(null);

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
  return result as unknown as null | {mode: string; id?: string};
}

export default useActualState;
