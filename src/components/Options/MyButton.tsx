import {Button, ButtonProps} from '@mui/material';
import React, {FC} from 'react';

const MyButton: FC<ButtonProps> = (props) => {
  // @ts-ignore
  return <Button disableElevation {...props} />;
};

export default MyButton as typeof Button;
