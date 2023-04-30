function fileReaderReady(reader: FileReader) {
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
  });
}

export async function readBlobAsText(blob: Blob) {
  const reader = new FileReader();
  const promise = fileReaderReady(reader);
  reader.readAsText(blob);
  return promise;
}
