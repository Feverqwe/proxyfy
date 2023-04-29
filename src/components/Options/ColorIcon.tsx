import React from "react";
import getExtensionIcon from "../../tools/getExtensionIcon";
import getUrlFromImageData from "../../tools/getUrlFromImageData";

const colorIconStyle = {
  display: 'inline-block',
  width: '24px',
  height: '24px',
  verticalAlign: 'middle',
};

const ColorIcon = React.memo(({color}) => {
  const iconUrl = React.useMemo(() => getUrlFromImageData(color, 24, getExtensionIcon), [color]);

  return (
    <div style={colorIconStyle}>
      <img src={iconUrl} width={24} height={24} alt={'color'} />
    </div>
  );
});

export default ColorIcon;
