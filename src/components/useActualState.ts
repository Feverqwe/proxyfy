import React from "react";
import promisifyApi from "../tools/promisifyApi";

const useActualState = () => {
  const [state, setState] = React.useState<null | {mode: string, id?: string}>(null);

  React.useEffect(() => {
    let mounted = true;
    chrome.runtime.onMessage.addListener(listener);

    fetchState();

    function listener(message: Record<string, any>) {
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

function getState() {
  return promisifyApi<null | {mode: string, id?: string}>('chrome.runtime.sendMessage')({
    action: 'get'
  });
}


export default useActualState;
