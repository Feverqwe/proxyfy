import React, {FC, useMemo} from 'react';
import {getExtensionIcon, getUrlFromImageData} from '../../tools/index';

const colorIconStyle = {
  display: 'inline-block',
  width: '24px',
  height: '24px',
  verticalAlign: 'middle',
};

interface ColorIconProps {
  color: string;
}

const ColorIcon: FC<ColorIconProps> = ({color}) => {
  const iconUrl = useMemo(() => getUrlFromImageData(color, 24, getExtensionIcon), [color]);

  return (
    <div style={colorIconStyle}>
      <img src={iconUrl} width={24} height={24} alt="color" />
    </div>
  );
};

export default ColorIcon;
