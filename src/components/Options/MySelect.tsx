import React from "react";
import {FormControl, Select, Typography} from "@material-ui/core";

const MySelect = React.memo(({label, children, ...props}) => {
  return (
    <FormControl fullWidth margin={'dense'}>
      <Typography variant={"subtitle1"}>
        {label}
      </Typography>
      <Select
        variant="outlined"
        size="small"
        {...props}
      >
        {children}
      </Select>
    </FormControl>
  );
});

export default MySelect;
