import React, {FC, useMemo} from 'react';

import {Box, Stack, Typography} from '@mui/material';

import {getExtensionIcon, getUrlFromImageData} from '../tools/index';

interface HeaderProps {
  title: string;
}

const Header: FC<HeaderProps> = ({title}) => {
  const logoUrl = useMemo(() => getUrlFromImageData('#2864dc', 32, getExtensionIcon), []);

  return (
    <Box
      component="header"
      sx={{
        maxWidth: 1040,
        mx: 'auto',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
        <img src={logoUrl} width={28} height={28} alt="" />
        <Typography component="h1" variant="h4">
          {title}
        </Typography>
      </Stack>
    </Box>
  );
};

export default Header;
