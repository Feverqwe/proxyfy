import {Box, Grid, makeStyles, Paper, Typography} from "@material-ui/core";
import * as React from "react";
import * as PropTypes from "prop-types";
import logo from "../assets/icons/icon.svg";

const useStyles = makeStyles(() => {
  return {
    imageBox: {
      display: 'flex',
    },
  };
});


const Header = React.memo(({title}) => {
  const classes = useStyles();

  return (
    <Box component={Paper} mx={2} mt={2} p={1}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item className={classes.imageBox}>
          <img src={logo} alt={'Proxyfy'} width={50} height={50} />
        </Grid>
        <Grid item>
          <Typography variant={'h5'}>
            {title}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
});
Header.propTypes = {
  title: PropTypes.string,
};

export default Header;
