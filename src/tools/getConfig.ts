import promisifyApi from './promisifyApi';
import {Config, DefaultConfigStruct} from './ConfigStruct';

async function getConfig() {
  return promisifyApi<Config>('chrome.storage.sync.get')().then((storage) => {
    try {
      return DefaultConfigStruct.create(storage) as Config;
    } catch (err) {
      console.error('Validate config error: %O', err);
      console.error('Config: %s', JSON.stringify(storage));
      return DefaultConfigStruct.create({}) as Config;
    }
  });
}

export default getConfig;
