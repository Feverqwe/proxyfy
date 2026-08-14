import React, {FC, ReactNode} from 'react';

import {CacheProvider} from '@emotion/react';
import {CssBaseline, GlobalStyles, ThemeProvider} from '@mui/material';
import {GlobalStylesProps} from '@mui/material/GlobalStyles';

import {theme} from '../index';

import cache from './muiCache';

interface PageBaseProps {
  children: ReactNode;
  rootStyles?: GlobalStylesProps['styles'];
}

const PageBase: FC<PageBaseProps> = ({children, rootStyles}) => {
  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{'html, body, #root': {minHeight: '100%'}, body: {margin: 0}}} />
        {rootStyles && <GlobalStyles styles={rootStyles} />}
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
};

export default PageBase;
