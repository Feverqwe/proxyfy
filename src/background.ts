import {initBackgroundService} from './services/index';

initBackgroundService().catch((err) => {
  console.error('init error: %O', err);
});
