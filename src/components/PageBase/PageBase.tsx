import {CssBaseline, GlobalStyles, ThemeProvider} from '@mui/material';
import React, {FC, ReactNode} from 'react';
import {CacheProvider} from '@emotion/react';
import {GlobalStylesProps} from '@mui/material/GlobalStyles/GlobalStyles';
import cache from './muiCache';
import theme from '../theme';

interface PageBaseProps {
  children: ReactNode;
  rootStyles?: GlobalStylesProps['styles'];
}

const PageBase: FC<PageBaseProps> = ({children, rootStyles}) => {
  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={rootStyles} />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};

export default PageBase;
