const Fs = require('fs');
const archiver = require('archiver');

const compress = (source, target) => {
  const zipFolder = (srcFolder, zipFilePath, callback) => {
    const output = Fs.createWriteStream(zipFilePath);
    const zipArchive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', function() {
      callback();
    });

    zipArchive.pipe(output);

    zipArchive.directory(srcFolder, false);

    zipArchive.finalize(function(err, bytes) {
      if(err) {
        callback(err);
      }
    });
  };

  return new Promise((resolve, reject) => {
    zipFolder(source, target, err => {
      err ? reject(err) : resolve();
    })
  });
};

module.exports = compress;