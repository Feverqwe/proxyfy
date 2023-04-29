import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import {createTheme} from '@mui/material';
import {amber, blue} from '@mui/material/colors';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: blue,
    secondary: amber,
    background: {
      default: '#607d8b',
    },
    text: {
      primary: '#000',
      secondary: '#000000d9',
    },
  },
});

export default theme;
