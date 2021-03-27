import * as React from "react";
import {useEffect} from "react";
import {Box, Grid, List, ListItem, ListItemText, makeStyles, MenuItem, Paper, Select} from "@material-ui/core";
import getConfig from "../../tools/getConfig";
import {Link} from "react-router-dom";

const useStyles = makeStyles(() => {
  return {
    box: {
      minWidth: '400px',
    }
  };
});

const Options = React.memo(() => {
  const classes = useStyles();

  const [proxies, setProxies] = React.useState([]);

  useEffect(() => {
    let isMounted = true;
    getConfig().then(({proxies}) => {
      if (!isMounted) return;
      setProxies(proxies.map((proxy) => {
        return {
          id: proxy.id,
          title: proxy.title,
        };
      }));
    }, (err) => {
      console.error('getConfig error: %O', err);
    });
    return () => {
      isMounted = false;
    }
  }, []);

  return (
    <Box p={2}>
      <Paper>
        <Grid container>
          <Grid item xs={2}>
            <Box m={2}>
              <List component="nav" disablePadding>
                <ListItem button component={Link} to={'/proxy'}>
                  <ListItemText primary={'Add'}/>
                </ListItem>
              </List>
            </Box>
          </Grid>
          <Grid item xs={9}>
            <Box m={2}>
              <Select value={"auto_detect"}>
                <MenuItem value="auto_detect">
                  Use enabled proxies by patterns and order
                </MenuItem>
                <MenuItem value="system">
                  Off (use Chrome settings)
                </MenuItem>
                {proxies.map((proxy) => {
                  return (
                    <MenuItem id={proxy.id} value={proxy.id}>
                      {proxy.title}
                    </MenuItem>
                  );
                })}
              </Select>
            </Box>
            <Box m={2}>
              <Grid container spacing={3}>
                {proxies.map((proxy) => {
                  return (
                    <Grid key={proxy.id} item xs={9}>
                      {proxy.title}
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
});

export default Options;
