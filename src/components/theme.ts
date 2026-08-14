import {createTheme} from '@mui/material';

import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2864dc',
      dark: '#1649ad',
      light: '#eaf1ff',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#087f75',
      dark: '#08635c',
      light: '#e5f6f3',
      contrastText: '#ffffff',
    },
    error: {
      main: '#c93c37',
    },
    background: {
      default: '#f5f6f7',
      paper: '#ffffff',
    },
    text: {
      primary: '#15263a',
      secondary: '#5d6d7e',
    },
    divider: '#dce4ed',
    action: {
      hover: '#f1f5fa',
      selected: '#eaf1ff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 700,
    },
    h6: {
      fontSize: '0.95rem',
      fontWeight: 700,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
    overline: {
      fontSize: '0.68rem',
      fontWeight: 700,
      letterSpacing: '0.12em',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 34,
          borderRadius: 7,
          paddingInline: 12,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 9,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          backgroundColor: '#ffffff',
        },
        notchedOutline: {
          borderColor: '#cbd6e2',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: '8px 10px',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '::selection': {
          backgroundColor: '#cdddff',
        },
        '*:focus-visible': {
          outline: '3px solid rgba(40, 100, 220, 0.28)',
          outlineOffset: 2,
        },
      },
    },
  },
});

export default theme;
