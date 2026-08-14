import React, {FC, useMemo} from 'react';

import {Box, Stack, Typography} from '@mui/material';

import {getExtensionIcon, getUrlFromImageData} from '../tools/index';

interface HeaderProps {
  title: string;
}

const Header: FC<HeaderProps> = ({title}) => {
  const logoUrl = useMemo(() => getUrlFromImageData('#2864dc', 44, getExtensionIcon), []);

  return (
    <Box component="header" sx={{maxWidth: 1180, mx: 'auto', px: {xs: 2, sm: 3}, pt: 3, pb: 2}}>
      <Stack direction="row" spacing={1.5} sx={{alignItems: 'center'}}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 48,
            height: 48,
            borderRadius: 2.5,
            bgcolor: 'primary.light',
          }}
        >
          <img src={logoUrl} width={38} height={38} alt="" />
        </Box>
        <Box>
          <Typography variant="overline" color="primary.main">
            Proxyfy
          </Typography>
          <Typography component="h1" variant="h4">
            {title}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default Header;
