import {readConfig} from '../services/config/configService';

import type {Config} from './ConfigSchema';

async function getConfig(): Promise<Config> {
  return readConfig();
}

export default getConfig;
