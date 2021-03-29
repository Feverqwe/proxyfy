function getCircleIcon(color: string) {
  const path = new Path2D('M 0, 12 a 12,12 0 1,1 24,0 a 12,12 0 1,1 -24,0');

  const canvas = new OffscreenCanvas(24, 24);
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.fill(path);
  return context.getImageData(0, 0, 24, 24);
}

export default getCircleIcon;
