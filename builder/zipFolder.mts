import {createWriteStream} from 'node:fs';

import {ZipArchive} from 'archiver';

const zipFolder = async (srcFolder: string, zipFilePath: string) => {
  const output = createWriteStream(zipFilePath);
  const zipArchive = new ZipArchive({
    zlib: {level: 9},
  });

  zipArchive.pipe(output);
  zipArchive.directory(srcFolder, false);

  await zipArchive.finalize();
};

export default zipFolder;
