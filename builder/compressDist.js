const compress = require('./compress');
const Fs = require('fs');
const Path = require('path');

let source = Path.resolve(process.argv[process.argv.indexOf('--target') + 1]);

source = Path.join(source, 'chrome');

Fs.accessSync(source);

const manifest = require(source + '/manifest.json');

const target = Path.join(source, '..', Path.basename(source) + '_' + manifest.version + '.zip');

compress(source, target);
