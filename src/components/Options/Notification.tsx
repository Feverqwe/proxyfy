import React, {FC, ReactNode, useEffect, useState} from 'react';
import {Box, Paper, Zoom} from '@mui/material';
import {styled} from '@mui/system';

const NotifyBox = styled(Box)({
  position: 'fixed',
  top: '30px',
  right: '30px',
});

interface NotificationProps {
  notify: {text: ReactNode};
}

const Notification: FC<NotificationProps> = ({notify}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShow(false);
    }, 3 * 1000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  if (!show) return null;

  return (
    <Zoom in={show}>
      <NotifyBox>
        <Box component={Paper} elevation={3} p={1} px={2}>
          {notify.text}
        </Box>
      </NotifyBox>
    </Zoom>
  );
};

export default Notification;
