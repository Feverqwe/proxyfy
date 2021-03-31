import React from "react";
import {FormControl, makeStyles, TextField, Typography} from "@material-ui/core";

const useStyles = makeStyles(() => {
  return {
    hidden: {
      visibility: 'hidden',
    }
  };
});

const MyInput = React.memo(({label, isError = false, hidden, ...props}) => {
  const classes = useStyles();

  return (
    <FormControl fullWidth margin={'dense'} className={hidden ? classes.hidden : ''}>
      <Typography variant={"subtitle1"}>
        {label}
      </Typography>
      <TextField
        variant="outlined"
        size="small"
        error={isError}
        autoComplete={'off'}
        {...props}
      />
    </FormControl>
  );
});

export default MyInput;
