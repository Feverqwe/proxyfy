const getExtensionIcon = (color = '#0a77e5') => {
  const body = require('!raw-loader!../../img/icon.svg');
  const head = 'data:image/svg+xml;text,';
  return head + body.replace(/#303c42/g, color);
};

export default getExtensionIcon;