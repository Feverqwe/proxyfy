import {StorageFactory} from '../storage/index';

import {Config, parseStoredConfig} from './index';

async function getConfig(): Promise<Config> {
  const storageFactory = StorageFactory.getInstance();
  await storageFactory.initialize();
  const storageService = storageFactory.getStorageService();

  try {
    const storage = await storageService.get();
    return parseStoredConfig(storage);
  } catch (err) {
    console.error('Validate config error: %O', err);
    return parseStoredConfig({});
  }
}

export default getConfig;
