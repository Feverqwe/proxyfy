const Fs = require('fs');
const Path = require('path');
const compress = require('./compress');

let source = Path.resolve(process.argv[process.argv.indexOf('--target') + 1]);

source = Path.join(source, 'chrome');

Fs.accessSync(source);

const manifest = JSON.parse(Fs.readFileSync(`${source}/manifest.json`, 'utf8'));

const target = Path.join(source, '..', `${Path.basename(source)}_${manifest.version}.zip`);

compress(source, target);
