import {Box, Grid, makeStyles, Paper, Typography} from "@material-ui/core";
import React from "react";
import PropTypes from "prop-types";
import getExtensionIcon from "../tools/getExtensionIcon";

const useStyles = makeStyles(() => {
  return {
    imageBox: {
      display: 'flex',
    },
  };
});


const Header = React.memo(({title}) => {
  const classes = useStyles();
  const refLogo = React.useRef();

  React.useEffect(() => {
    const canvas = refLogo.current;
    const imageData = getExtensionIcon('#0a77e5', 50);
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
  }, []);

  return (
    <Box component={Paper} mx={2} mt={2} p={1}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item className={classes.imageBox}>
          <canvas ref={refLogo} width={50} height={50} />
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
