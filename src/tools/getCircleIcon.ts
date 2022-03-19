declare const OffscreenCanvas: any;

function getCircleIcon(color: string, wh = 24) {
  const path = new Path2D('M 0, 12 a 12,12 0 1,1 24,0 a 12,12 0 1,1 -24,0');

  const canvas = new OffscreenCanvas(wh, wh);
  const context = canvas.getContext('2d')!;
  const scale = wh / 24;
  context.scale(scale, scale);
  context.fillStyle = color;
  context.fill(path);
  return context.getImageData(0, 0, wh, wh);
}

export default getCircleIcon;
