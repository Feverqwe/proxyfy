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

export default fileReaderReady;
