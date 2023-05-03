import * as fs from "fs";
import * as path from "path";

import zipFolder from "./zipFolder";

let source = path.resolve(process.argv[process.argv.indexOf('--target') + 1]);

source = path.join(source, 'chrome');

fs.accessSync(source);

const manifest = JSON.parse(fs.readFileSync(`${source}/manifest.json`, 'utf8'));

const target = path.join(source, '..', `${path.basename(source)}_${manifest.version}.zip`);

zipFolder(source, target);
