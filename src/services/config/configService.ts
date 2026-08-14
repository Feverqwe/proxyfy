import {ConfigRepository} from '../../storage/ConfigRepository';
import {StorageFactory} from '../../storage/StorageFactory';
import type {Config} from '../../tools/ConfigSchema';

type ConfigUpdater = (config: Config) => Config | void;

let updateQueue: Promise<void> = Promise.resolve();

async function createRepository(): Promise<ConfigRepository> {
  const storageFactory = StorageFactory.getInstance();
  await storageFactory.initialize();
  return new ConfigRepository(storageFactory.getStorageService());
}

export async function readConfig(): Promise<Config> {
  const repository = await createRepository();
  return repository.read();
}

export function writeConfig(config: Config): Promise<void> {
  return enqueueUpdate(async () => {
    const repository = await createRepository();
    await repository.write(config);
  });
}

export function updateConfig(updater: ConfigUpdater): Promise<Config> {
  let updatedConfig: Config | undefined;

  return enqueueUpdate(async () => {
    const repository = await createRepository();
    const currentConfig = await repository.read();
    updatedConfig = updater(currentConfig) || currentConfig;
    await repository.write(updatedConfig);
  }).then(() => updatedConfig!);
}

function enqueueUpdate<T>(operation: () => Promise<T>): Promise<T> {
  const queuedOperation = updateQueue.then(operation, operation);
  updateQueue = queuedOperation.then(
    () => undefined,
    () => undefined,
  );
  return queuedOperation;
}
