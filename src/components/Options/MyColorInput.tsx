import React, {FC} from 'react';
import {
  Box,
  FormControl,
  IconButton,
  InputAdornment,
  Popper,
  TextField,
  Typography,
} from '@mui/material';
import ColorizeIcon from '@mui/icons-material/Colorize';
import {ChromePicker} from 'react-color';
import getExtensionIcon from '../../tools/getExtensionIcon';
import getCircleIcon from '../../tools/getCircleIcon';

const canvasStyle = {width: '24px', height: '24px'};
const canvasDprSize = 24 * window.devicePixelRatio;

type MyColorInputProps = {
  label: string;
  value: string;
  iconType?: string;
  format?: string;
  name: string;
};

const MyColorInput: FC<MyColorInputProps> = ({
  label,
  value,
  iconType = 'circle',
  format = 'hex',
  name,
}) => {
  const [color, setColor] = React.useState(value);
  const [showPicker, setShowPicker] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const refPickerBody = React.useRef<HTMLDivElement | null>(null);
  const refPickerBtn = React.useRef<HTMLButtonElement | null>(null);
  const refColorIcon = React.useRef<HTMLCanvasElement | null>(null);

  const handleChangeColor = React.useCallback(
    (color) => {
      if (format === 'rgba') {
        const {r, g, b, a} = color.rgb;
        const colorStr = `rgba(${r},${g},${b},${a})`;
        setColor(colorStr);
      } else {
        setColor(color.hex);
      }
    },
    [format],
  );

  const handleChange = React.useCallback((e) => {
    setColor(e.target.value);
  }, []);

  const handleClickPick = React.useCallback((e) => {
    setAnchorEl(e.currentTarget);
    setShowPicker((r) => !r);
  }, []);

  React.useEffect(() => {
    if (!showPicker) return;
    document.addEventListener('click', listener);
    function listener(e: MouseEvent) {
      const target = e.target as HTMLElement;
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
    if (!canvas) return;
    canvas.width = canvasDprSize;
    canvas.height = canvasDprSize;
    let imageData;
    if (iconType === 'logo') {
      imageData = getExtensionIcon(color, canvasDprSize);
    } else {
      imageData = getCircleIcon(color, canvasDprSize);
    }
    const context = canvas.getContext('2d');
    if (!context) return;
    context.putImageData(imageData, 0, 0);
  }, [color, iconType]);

  const inputProps = React.useMemo(() => {
    return {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton ref={refPickerBtn} onClick={handleClickPick} edge="end">
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
      <FormControl fullWidth margin="dense">
        <Typography variant="subtitle1">{label}</Typography>
        <TextField
          variant="outlined"
          size="small"
          value={color}
          onChange={handleChange}
          autoComplete="off"
          InputProps={inputProps}
          name={name}
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
};

export default MyColorInput;
