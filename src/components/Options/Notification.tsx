import React, {FC, ReactNode, useEffect, useState} from 'react';

import {Alert, AlertColor, Snackbar} from '@mui/material';

interface NotificationProps {
  notify: {text: ReactNode; severity?: AlertColor};
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
    <Snackbar
      open={show}
      anchorOrigin={{vertical: 'top', horizontal: 'right'}}
      onClose={() => setShow(false)}
    >
      <Alert
        elevation={6}
        variant="filled"
        severity={notify.severity || 'success'}
        onClose={() => setShow(false)}
      >
        {notify.text}
      </Alert>
    </Snackbar>
  );
};

export default Notification;
