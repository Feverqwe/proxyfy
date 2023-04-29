import React from "react";
import getExtensionIcon from "../../tools/getExtensionIcon";
import {Box, FormControl, InputAdornment, Popper, TextField, Typography} from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import ColorizeIcon from "@material-ui/icons/Colorize";
import {ChromePicker} from "react-color";
import getCircleIcon from "../../tools/getCircleIcon";

const canvasStyle = {width: '24px', height: '24px'};
const canvasDprSize = 24 * window.devicePixelRatio;

const MyColorInput = React.memo(({label, value, iconType = 'circle', format = 'hex', ...props}) => {
  const [color, setColor] = React.useState(value);
  const [showPicker, setShowPicker] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const refPickerBody = React.useRef();
  const refPickerBtn = React.useRef();
  const refColorIcon = React.useRef();

  const handleChangeColor = React.useCallback((color) => {
    if (format === 'rgba') {
      const {r,g,b,a} = color.rgb;
      const colorStr = `rgba(${r},${g},${b},${a})`;
      setColor(colorStr);
    } else {
      setColor(color.hex);
    }
  }, []);

  const handleChange = React.useCallback((e) => {
    setColor(e.target.value);
  }, []);

  const handleClickPick = React.useCallback((e) => {
    setAnchorEl(e.currentTarget)
    setShowPicker(r => !r);
  }, []);

  React.useEffect(() => {
    if (!showPicker) return;
    document.addEventListener('click', listener);
    function listener(e) {
      const target = e.target;
      const body = refPickerBody.current;
      const btn = refPickerBtn.current;
      if (!body || !btn) return;
      if (body.contains(target) || btn.contains(target)) return;
      setShowPicker(false);
    }
    return () => {
      document.removeEventListener('click', listener);
    };
  }, [showPicker]);

  React.useEffect(() => {
    const canvas = refColorIcon.current;
    canvas.width = canvasDprSize;
    canvas.height = canvasDprSize;
    let imageData;
    if (iconType === 'logo') {
      imageData = getExtensionIcon(color, canvasDprSize);
    } else {
      imageData = getCircleIcon(color, canvasDprSize);
    }
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
  }, [color]);

  const inputProps = React.useMemo(() => {
    return {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            ref={refPickerBtn}
            onClick={handleClickPick}
            edge="end"
          >
            <ColorizeIcon />
          </IconButton>
        </InputAdornment>
      ),
      startAdornment: (
        <InputAdornment position="start">
          <canvas ref={refColorIcon} style={canvasStyle} />
        </InputAdornment>
      ),
    };
  }, [handleClickPick]);

  return (
    <>
      <FormControl fullWidth margin={'dense'}>
        <Typography variant={"subtitle1"}>
          {label}
        </Typography>
        <TextField
          variant="outlined"
          size="small"
          value={color}
          onChange={handleChange}
          autoComplete={'off'}
          InputProps={inputProps}
          {...props}
        />
      </FormControl>
      <Popper open={showPicker} anchorEl={anchorEl}>
        <Box ref={refPickerBody}>
          <ChromePicker
            color={color}
            onChange={handleChangeColor}
            disableAlpha={format === 'hex'}
          />
        </Box>
      </Popper>
    </>
  );
});

export default MyColorInput;
