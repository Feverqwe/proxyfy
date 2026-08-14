import React, {FC} from 'react';

import {Button, ButtonProps} from '@mui/material';

const MyButton: FC<ButtonProps> = (props) => {
  // @ts-ignore
  return <Button disableElevation {...props} />;
};

export default MyButton as typeof Button;
