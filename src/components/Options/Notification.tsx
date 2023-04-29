import React, {FC, ReactNode} from 'react';
import {Box, Paper, Zoom} from '@mui/material';
import {styled} from '@mui/system';

const NotifyBox = styled(Box)(({theme}) => {
  return {
    position: 'fixed',
    top: '30px',
    right: '30px',
    backgroundColor: theme.palette.primary.light,
  };
});

interface NotificationProps {
  notify: {text: ReactNode};
}

const Notification: FC<NotificationProps> = ({notify}) => {
  const [show, setShow] = React.useState(true);

  React.useEffect(() => {
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
      <NotifyBox p={1}>
        <Paper elevation={3}>{notify.text}</Paper>
      </NotifyBox>
    </Zoom>
  );
};

export default Notification;
