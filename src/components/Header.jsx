import {Box, Grid, makeStyles, Paper, Typography} from "@material-ui/core";
import React from "react";
import PropTypes from "prop-types";
import getExtensionIcon from "../tools/getExtensionIcon";
import getUrlFromImageData from "../tools/getUrlFromImageData";

const useStyles = makeStyles(() => {
  return {
    imageBox: {
      display: 'flex',
    },
  };
});


const Header = React.memo(({title}) => {
  const classes = useStyles();
  const logoUrl = React.useMemo(() => getUrlFromImageData('#0a77e5', 50, getExtensionIcon), []);

  return (
    <Box component={Paper} mx={2} mt={2} p={1}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item className={classes.imageBox}>
          <img src={logoUrl} width={50} height={50} alt={'Proxyfy'} />
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
