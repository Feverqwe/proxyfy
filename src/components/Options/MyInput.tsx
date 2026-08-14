import React, {FC, ReactNode} from 'react';

import {TextField, TextFieldProps} from '@mui/material';

type MyInputProps = {
  label: ReactNode;
  isError?: boolean;
  errorMessage?: ReactNode;
  hidden?: boolean;
} & TextFieldProps;

const MyInput: FC<MyInputProps> = ({label, isError = false, errorMessage, hidden, ...props}) => {
  return (
    <TextField
      fullWidth
      margin="normal"
      label={label}
      variant="outlined"
      error={isError}
      helperText={isError ? errorMessage : props.helperText}
      autoComplete="off"
      sx={{visibility: hidden ? 'hidden' : undefined}}
      {...props}
    />
  );
};

export default MyInput;
