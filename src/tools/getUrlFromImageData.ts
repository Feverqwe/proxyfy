function getUrlFromImageData(color: string, size: number, builder: (color: string, size: number) => ImageData) {
  const SIZE = size * window.devicePixelRatio;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const imageData = builder(color, SIZE);
  const context = canvas.getContext('2d')!;
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png', 1);
}

export default getUrlFromImageData;
