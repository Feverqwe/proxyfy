const Fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const archiver = require('archiver');

const compress = (source, target) => {
  const zipFolder = (srcFolder, zipFilePath, callback) => {
    const output = Fs.createWriteStream(zipFilePath);
    const zipArchive = archiver('zip', {
      zlib: {level: 9},
    });

    output.on('close', () => {
      callback();
    });

    zipArchive.pipe(output);

    zipArchive.directory(srcFolder, false);

    zipArchive.finalize((err, bytes) => {
      if (err) {
        callback(err);
      }
    });
  };

  return new Promise<void>((resolve, reject) => {
    zipFolder(source, target, (err) => {
      err ? reject(err) : resolve();
    });
  });
};

module.exports = compress;
