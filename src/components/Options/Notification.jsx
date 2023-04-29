import React from "react";
import {Box, makeStyles, Paper, Zoom} from "@material-ui/core";

const useStyles = makeStyles((theme) => {
  return {
    notify: {
      position: 'fixed',
      top: '30px',
      right: '30px',
      backgroundColor: theme.palette.primary.light,
    }
  };
});

const Notification = React.memo(({notify}) => {
  const classes = useStyles();
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
      <Box component={Paper} p={1} elevation={3} className={classes.notify}>
        {notify.text}
      </Box>
    </Zoom>
  );
});

export default Notification;
