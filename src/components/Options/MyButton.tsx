import React from "react";
import {Button} from "@material-ui/core";

const MyButton = React.memo(({ ...props}) => {
  return (
    <Button disableElevation {...props}/>
  );
});

export default MyButton;
