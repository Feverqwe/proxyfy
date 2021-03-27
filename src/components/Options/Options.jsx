import * as React from "react";
import {useEffect} from "react";
import {
  Box, FormControl,
  Grid,
  List,
  ListItem, ListItemIcon,
  ListItemText,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  Typography
} from "@material-ui/core";
import getConfig from "../../tools/getConfig";
import {Link} from "react-router-dom";
import Header from "../Header";
import AddIcon from '@material-ui/icons/Add';

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
    <>
      <Header title={'Options'}/>
      <Box p={2}>
        <Paper>
          <Grid container>
            <Grid item xs={3}>
              <Box m={2}>
                <List component="nav" disablePadding>
                  <ListItem button component={Link} to={'/proxy'}>
                    <ListItemIcon>
                      <AddIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={'Add'}
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
            <Grid item xs={8}>
              <Box m={2}>
                <MySelectNoLabel value={"auto_detect"}>
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
                </MySelectNoLabel>

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
    </>
  );
});

const MySelectNoLabel = React.memo(({children, ...props}) => {
  return (
    <FormControl margin={'dense'}>
      <Select
        variant="outlined"
        size="small"
        {...props}
      >
        {children}
      </Select>
    </FormControl>
  );
});

export default Options;
