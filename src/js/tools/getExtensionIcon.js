const getExtensionIcon = (color) => {
  color = color || '#737373';
  const body = require('!raw-loader!../../img/icon.svg');
  const head = 'data:image/svg+xml;text,';
  return head + encodeURIComponent(body.replace(/#303c42/g, color));
};

export default getExtensionIcon;