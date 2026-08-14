import {getConfigFromBackground} from '../services/runtime/runtimeClient';
import {RuntimeAction} from '../services/runtime/runtimeContract';
import type {ConfigProxy} from '../tools/index';

import {useBackgroundValue} from './useBackgroundValue';

const fetchProxies = async (): Promise<ConfigProxy[]> => {
  const {proxies} = await getConfigFromBackground();
  return proxies;
};

const useActualProxies = () => useBackgroundValue(RuntimeAction.ProxiesChanged, fetchProxies);

export default useActualProxies;
