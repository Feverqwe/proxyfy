import React, {createElement, FC, ReactNode} from 'react';
import {FormControl, Select, SelectProps, Typography} from '@mui/material';

type MySelectProps = {
  label: ReactNode;
  children: ReactNode;
} & SelectProps;

const MySelect: FC<MySelectProps> = ({label, children, ...props}) => {
  return (
    <FormControl fullWidth margin="dense">
      <Typography variant="subtitle1">{label}</Typography>
      <Select
        variant="outlined"
        size="small"
        {...props}
      >
        {children}
      </Select>
    </FormControl>
  );
};

export default MySelect;
