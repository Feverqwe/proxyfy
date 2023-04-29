import React from "react";
import ReactDOM from "react-dom";
import {ThemeProvider} from "@material-ui/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Options from "./components/Options/Options";
import theme from "./components/theme";
import {createHashHistory} from "history";
import {Router} from "react-router";
import {Route, Switch} from "react-router-dom";
import Proxy from "./components/Options/Proxy";
import Patterns from "./components/Options/Patterns";

const history = createHashHistory();

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline/>
    <Router history={history}>
      <Switch>
        <Route path={'/'} exact={true}>
          <Options/>
        </Route>
        <Route path={'/proxy'} exact={true}>
          <Proxy/>
        </Route>
        <Route path={'/patterns'} exact={true}>
          <Patterns/>
        </Route>
      </Switch>
    </Router>
  </ThemeProvider>,
  document.getElementById('root')
);
