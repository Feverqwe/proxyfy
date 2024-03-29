function getExtensionIcon(color = '#737373', wh = 24) {
  const path = new Path2D(
    'M21.613 14.682a.544.544 0 0 0-.264-.145c-.195-.043-.424.013-.75.106-.45.129-1.131.322-1.991.322-1.455 0-2.869-.57-4.206-1.69l1.548-1.546a.544.544 0 0 0-.386-.931h-1.262A1.098 1.098 0 0 1 13.205 9.7V8.44a.545.545 0 0 0-.93-.385l-1.546 1.548C8.391 6.819 9.064 4.446 9.36 3.408c.096-.337.154-.54.106-.75a.54.54 0 0 0-.145-.263A8 8 0 0 0 3.6.014a8.055 8.055 0 0 0-3.275.69.546.546 0 0 0-.186.863A8.991 8.991 0 0 1 2.141 9.96a.544.544 0 0 0 .172.557c.139.118.277.238.407.367a6.964 6.964 0 0 1 2.029 5.27c-.061 1.246-.563 2.527-1.453 3.703l-.264.349a.544.544 0 0 0 .763.763l.349-.265c1.175-.89 2.457-1.391 3.704-1.451a6.969 6.969 0 0 1 5.273 2.028c.129.13.248.268.365.405.136.16.348.227.558.174 2.915-.792 6.141-.026 8.395 2a.54.54 0 0 0 .479.129.543.543 0 0 0 .385-.313c1.345-3.04.665-6.655-1.69-8.993z',
  );

  const canvas = new OffscreenCanvas(wh, wh);
  const context = canvas.getContext('2d')!;
  const scale = wh / 24;
  context.scale(scale, scale);
  context.fillStyle = color;
  context.fill(path);
  return context.getImageData(0, 0, wh, wh);
}

export default getExtensionIcon;
