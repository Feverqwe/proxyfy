import React, {FC, useMemo} from 'react';
import {Box, Grid, Paper, Typography} from '@mui/material';
import getExtensionIcon from '../tools/getExtensionIcon';
import getUrlFromImageData from '../tools/getUrlFromImageData';

interface HeaderProps {
  title: string;
}

const Header: FC<HeaderProps> = ({title}) => {
  const logoUrl = useMemo(() => getUrlFromImageData('#0a77e5', 50, getExtensionIcon), []);

  return (
    <Box component={Paper} mx={2} mt={2} p={1}>
      <Grid container alignItems="center" spacing={2}>
        <Grid display="flex" item>
          <img src={logoUrl} width={50} height={50} alt="Proxyfy" />
        </Grid>
        <Grid item>
          <Typography variant="h5">{title}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Header;
