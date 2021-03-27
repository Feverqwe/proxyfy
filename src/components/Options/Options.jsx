import * as React from "react";
import {useEffect} from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from "@material-ui/core";
import getConfig from "../../tools/getConfig";
import {Link} from "react-router-dom";
import Header from "../Header";
import AddIcon from '@material-ui/icons/Add';
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';

const useStyles = makeStyles(() => {
  return {
    mainBox: {
      minHeight: '400px',
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
      proxies.push({
        id: '1',
        enabled: true,
        title: 'Alpine RP',
        color: '#FCB900',
        scheme: 'http',
        host: '192.168.0.123',
        port: 8080,
        username: '',
        password: '',
        whitePatterns: [],
        blackPatterns: [],
      });
      proxies.push({
        id: '2',
        enabled: true,
        title: 'Do',
        color: '#7BDCB5',
        scheme: 'socks5',
        host: '192.168.0.2',
        port: 1080,
        username: '',
        password: '',
        whitePatterns: [],
        blackPatterns: [],
      });
      setProxies(proxies);
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
                      <AddIcon/>
                    </ListItemIcon>
                    <ListItemText
                      primary={'Add'}
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
            <Grid item xs={8}>
              <Box m={2} className={classes.mainBox}>
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
                <TableContainer>
                  <Table>
                    <TableBody>
                      {proxies.map((proxy) => {
                        const isFirst = proxies.indexOf(proxy) === 0;
                        const isLast = proxies.indexOf(proxy) === proxies.length - 1;

                        return (
                          <TableRow key={proxy.id}>
                            <TableCell size={'small'}>
                              <Color color={proxy.color}/>
                            </TableCell>
                            <TableCell size={'small'}>
                              {proxy.title}
                            </TableCell>
                            <TableCell size={'small'}>
                              {proxy.host}
                            </TableCell>
                            <TableCell size={'small'}>
                              <Grid container spacing={1} alignItems="center">
                                <Grid item>
                                  <Checkbox defaultChecked={proxy.enabled}/>
                                </Grid>
                                <Grid item>
                                  <Button variant="outlined" size={'small'} color="secondary">
                                    Edit
                                  </Button>
                                </Grid>
                                <Grid item>
                                  <Button variant="outlined" size={'small'} color="secondary">
                                    Patterns
                                  </Button>
                                </Grid>
                                <Grid item>
                                  <IconButton size={'small'}>
                                    <DeleteIcon fontSize="small"/>
                                  </IconButton>
                                </Grid>
                                <Grid item>
                                  <IconButton disabled={isFirst} size={'small'}>
                                    <ArrowUpwardIcon fontSize="small"/>
                                  </IconButton>
                                </Grid>
                                <Grid item>
                                  <IconButton disabled={isLast} size={'small'}>
                                    <ArrowDownwardIcon fontSize="small"/>
                                  </IconButton>
                                </Grid>
                              </Grid>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
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

const Color = React.memo(({color}) => {
  return (
    <div style={{
      display: 'inline-block',
      width: '44px',
      height: '22px',
      backgroundColor: color,
      verticalAlign: 'middle',
    }}/>
  );
});

export default Options;
