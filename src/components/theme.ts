import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import {amber, blue} from "@material-ui/core/colors";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const themeType = 'light';

const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: amber,
    type: themeType,
    background: {
      default: '#607d8b',
    },
    text: {
      primary: '#000',
      secondary: '#000000d9',
    }
  },
});

export default theme;
