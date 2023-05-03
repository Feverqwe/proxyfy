import * as fs from 'fs';
// @ts-ignore
import archiver from 'archiver';

const zipFolder = async (srcFolder: string, zipFilePath: string) => {
  const output = fs.createWriteStream(zipFilePath);
  const zipArchive = archiver('zip', {
    zlib: {level: 9},
  });

  zipArchive.pipe(output);

  zipArchive.directory(srcFolder, false);

  await zipArchive.finalize();
};

export default zipFolder;
