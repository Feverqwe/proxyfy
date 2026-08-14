import type {ProxyState} from '../domain/proxy/proxyState';
import {getProxyState} from '../services/runtime/runtimeClient';
import {RuntimeAction} from '../services/runtime/runtimeContract';

import {useBackgroundValue} from './useBackgroundValue';

const useActualState = (): ProxyState | null =>
  useBackgroundValue(RuntimeAction.StateChanged, getProxyState);

export default useActualState;
