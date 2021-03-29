const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = filename;

  setTimeout(() => {
    downloadLink.dispatchEvent(new MouseEvent('click'));
  }, 0);

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 40 * 1000);
};

export default downloadBlob;
