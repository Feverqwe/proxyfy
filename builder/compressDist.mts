import {accessSync, readFileSync} from 'node:fs';
import path from 'node:path';

import zipFolder from './zipFolder.mts';

let source = path.resolve(process.argv[process.argv.indexOf('--target') + 1]);

source = path.join(source, 'chrome');

accessSync(source);

const manifest = JSON.parse(readFileSync(`${source}/manifest.json`, 'utf8'));

const target = path.join(source, '..', `${path.basename(source)}_${manifest.version}.zip`);

await zipFolder(source, target);
