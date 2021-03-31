import React from "react";
import getExtensionIcon from "../../tools/getExtensionIcon";

const colorIconStyle = {
  display: 'inline-block',
  width: '24px',
  height: '24px',
  verticalAlign: 'middle',
};

const ColorIcon = React.memo(({color}) => {
  const refColorIcon = React.useRef();

  React.useEffect(() => {
    const canvas = refColorIcon.current;
    const imageData = getExtensionIcon(color, 24);
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
  }, [color]);

  return (
    <div style={colorIconStyle}>
      <canvas ref={refColorIcon} width={24} height={24} />
    </div>
  );
});

export default ColorIcon;
