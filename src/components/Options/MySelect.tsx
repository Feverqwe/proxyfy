import React, {FC, ReactNode} from 'react';

import {FormControl, InputLabel, Select, SelectProps} from '@mui/material';

export type MySelectProps = {
  label: ReactNode;
  children: ReactNode;
} & SelectProps;

const MySelect: FC<MySelectProps> = ({label, children, ...props}) => {
  const labelId = `${String(props.name || 'proxyfy-select')}-label`;
  return (
    <FormControl fullWidth margin="dense" size="small">
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select labelId={labelId} label={label} variant="outlined" size="small" {...props}>
        {children}
      </Select>
    </FormControl>
  );
};

export default MySelect;
