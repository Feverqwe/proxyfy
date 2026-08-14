import {useEffect, useState} from 'react';

import {RuntimeAction, hasRuntimeAction} from '../services/runtime/runtimeContract';

type RuntimeActionValue = (typeof RuntimeAction)[keyof typeof RuntimeAction];

export function useBackgroundValue<T>(
  changedAction: RuntimeActionValue,
  fetchValue: () => Promise<T | null>,
): T | null {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    let mounted = true;

    const refresh = () => {
      fetchValue()
        .then((nextValue) => {
          if (mounted) setValue(nextValue);
        })
        .catch((err) => {
          console.error('Get background value error: %O', err);
          if (mounted) setValue(null);
        });
    };
    const listener = (message: Record<string, unknown>) => {
      if (hasRuntimeAction(message, changedAction)) refresh();
    };

    chrome.runtime.onMessage.addListener(listener);
    refresh();

    return () => {
      mounted = false;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [changedAction, fetchValue]);

  return value;
}
