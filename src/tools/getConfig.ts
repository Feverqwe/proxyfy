import {Config, DefaultConfigStruct} from './ConfigStruct.js';
import {StorageFactory} from '../storage/StorageFactory.js';

async function getConfig(): Promise<Config> {
  const storageFactory = StorageFactory.getInstance();
  await storageFactory.initialize();
  const storageService = storageFactory.getStorageService();

  try {
    const storage = await storageService.get();
    // Use type assertion since DefaultConfigStruct.create should ensure type safety
    return DefaultConfigStruct.create(storage) as Config;
  } catch (err) {
    console.error('Validate config error: %O', err);
    return DefaultConfigStruct.create({}) as Config;
  }
}

export default getConfig;
