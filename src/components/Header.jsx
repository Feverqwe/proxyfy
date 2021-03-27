import {Box, Paper, Typography} from "@material-ui/core";
import * as React from "react";
import * as PropTypes from "prop-types";

const Header = React.memo(({title}) => {
  return (
    <Box pt={2} px={2}>
      <Paper>
        <Box p={2}>
          <Typography variant={'h5'}>
            {title}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
});
Header.propTypes = {
  title: PropTypes.string,
};

export default Header;
