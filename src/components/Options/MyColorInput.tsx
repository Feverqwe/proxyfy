import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {getCircleIcon, getExtensionIcon} from '../../tools/index';
import type {ChromePickerColor} from '../../types/index';

const canvasStyle = {width: '24px', height: '24px'};
const canvasDprSize = 24 * window.devicePixelRatio;

type MyColorInputProps = {
  label: string;
  defaultValue?: string;
  iconType?: string;
  format?: string;
  name: string;
  onChange?: (color: string) => void;
};

const MyColorInput: FC<MyColorInputProps> = ({
  label,
  defaultValue = '',
  iconType = 'circle',
  format = 'hex',
  name,
  onChange,
}) => {
  const [color, setColor] = useState(defaultValue);
  const [showPicker, setShowPicker] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const refPickerBody = useRef<HTMLDivElement | null>(null);
  const refPickerBtn = useRef<HTMLButtonElement | null>(null);
  const refColorIcon = useRef<HTMLCanvasElement | null>(null);

  const handleChangeColor = useCallback(
    (color: ChromePickerColor) => {
      let newColor: string;
      if (format === 'rgba') {
        const {r, g, b, a} = color.rgb;
        newColor = `rgba(${r},${g},${b},${a})`;
      } else {
        newColor = color.hex;
      }
      setColor(newColor);
      if (onChange) {
        onChange(newColor);
      }
    },
    [format, onChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setColor(newColor);
      if (onChange) {
        onChange(newColor);
      }
    },
    [onChange],
  );

  const handleClickPick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
    setShowPicker((r) => !r);
  }, []);

  useEffect(() => {
    if (!showPicker) return;
    document.addEventListener('click', listener);
    function listener(e: MouseEvent) {
      const target = e.target as Node;
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

  useEffect(() => {
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

  const inputProps = useMemo(() => {
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
