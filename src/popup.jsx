import * as React from "react";
import * as ReactDOM from "react-dom";
import purple from "@material-ui/core/colors/purple";
import {ThemeProvider} from "@material-ui/styles";
import {createMuiTheme, CssBaseline} from "@material-ui/core";
import Popup from "./components/Popup/Popup";

const themeType = 'dark';

const theme = createMuiTheme({
  palette: {
    primary: purple,
    type: themeType,
  }
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline/>
    <Popup/>
  </ThemeProvider>,
  document.getElementById('root')
);
