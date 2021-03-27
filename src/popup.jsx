import * as React from "react";
import * as ReactDOM from "react-dom";
import {ThemeProvider} from "@material-ui/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Popup from "./components/Popup/Popup";
import theme from "./components/theme";

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline/>
    <Popup/>
  </ThemeProvider>,
  document.getElementById('root')
);
