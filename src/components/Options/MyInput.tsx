import React, {FC, ReactNode} from 'react';
import {FormControl, TextField, TextFieldProps, Typography} from '@mui/material';

type MyInputProps = {
  label: ReactNode;
  isError?: boolean;
  hidden?: boolean;
} & TextFieldProps;

const MyInput: FC<MyInputProps> = ({label, isError = false, hidden, ...props}) => {
  return (
    <FormControl fullWidth margin="dense" style={{visibility: hidden ? 'hidden' : undefined}}>
      <Typography variant="subtitle1">{label}</Typography>
      <TextField variant="outlined" size="small" error={isError} autoComplete="off" {...props} />
    </FormControl>
  );
};

export default MyInput;
