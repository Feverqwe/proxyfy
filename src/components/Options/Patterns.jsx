import * as React from "react";
import {useEffect} from "react";
import {
  Box,
  Button,
  Checkbox,
  Grid,
  InputBase,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@material-ui/core";
import getConfig from "../../tools/getConfig";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Header from "../Header";
import {Redirect, useLocation} from "react-router";
import qs from "querystring-es3";
import promiseTry from "../../tools/promiseTry";
import {Link} from "react-router-dom";

const useStyles = makeStyles(() => {
  return {
    actionBox: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    button: {
      margin: '8px',
    },
    center: {
      textAlign: 'center',
    }
  };
});

const Patterns = React.memo(() => {
  const location = useLocation();
  const [proxy, setProxy] = React.useState(null);
  const [isRedirect, setRedirect] = React.useState(null);

  useEffect(() => {
    let isMounted = true;

    const query = qs.parse(location.search.substr(1));
    promiseTry(() => {
      if (query.id) {
        return getConfig().then(({proxies}) => {
          return proxies.find(p => p.id === query.id);
        });
      }
      return null;
    }).then((proxy) => {
      if (!isMounted) return;
      if (!proxy) {
        setRedirect(true);
      } else {
        setProxy(proxy);
      }
    }).catch((err) => {
      console.error('getConfig error: %O', err);
    });

    return () => {
      isMounted = false;
    }
  }, [location.search]);

  if (!proxy) return null;

  if (isRedirect) {
    return (
      <Redirect to={'/'} />
    );
  }

  return (
    <PatternsLoaded key={proxy.id} proxy={proxy}/>
  );
});

const PatternsLoaded = React.memo(({proxy}) => {
  const classes = useStyles();

  return (
    <>
      <Header title={'Edit patterns'}/>
      <Box p={2}>
        <Paper>
          <Grid container>
            <Grid item xs={12}>
              <Box m={2}>
                <Box my={2}>
                  <Typography variant={'h5'}>
                    White Patterns
                  </Typography>
                  <PatternList list={proxy.whitePatterns}/>
                  <Box my={2} className={classes.center}>
                    Add whitelist pattern to match all URLs
                    <Button variant="contained" size={'small'} className={classes.button} color="secondary">
                      Add
                    </Button>
                  </Box>
                </Box>
                <Typography variant={'h5'}>
                  Black Patterns
                </Typography>
                <PatternList list={proxy.blackPatterns}/>
                <Box my={2} className={classes.center}>
                  Add black patterns to prevent this proxy being used for localhost & intranet/private IP addresses
                  <Button variant="contained" size={'small'} className={classes.button} color="secondary">
                    Add
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box mx={2} mb={2} className={classes.actionBox}>
                <Button
                  component={Link}
                  to={'/'}
                  variant="contained"
                  className={classes.button}
                >
                  Cancel
                </Button>
                <Button variant="contained" className={classes.button} color="secondary">
                  New White
                </Button>
                <Button variant="contained" className={classes.button} color="secondary">
                  New Black
                </Button>
                <Button variant="contained" className={classes.button} color="primary">
                  Save
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </>
  );
});

const PatternList = React.memo(({list}) => {
  const classes = useStyles();

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell size={'small'}>Name</TableCell>
            <TableCell size={'small'}>Pattern</TableCell>
            <TableCell size={'small'}>Type</TableCell>
            <TableCell size={'small'}>Enabled</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.map((row) => (
            <TableRow key={row.name}>
              <TableCell size={'small'}>
                <InputBase defaultValue={row.name} fullWidth />
              </TableCell>
              <TableCell size={'small'}>
                <InputBase defaultValue={row.pattern} fullWidth />
              </TableCell>
              <TableCell size={'small'}>
                <Select
                  defaultValue={row.type}
                  fullWidth
                  input={<InputBase />}
                  inputProps={{
                    underline: 'none',
                  }}
                >
                  <MenuItem value={'wildcard'}>Wildcard</MenuItem>
                  <MenuItem value={'regexp'}>RegExp</MenuItem>
                </Select>
              </TableCell>
              <TableCell size={'small'}>
                <Grid container spacing={1} alignItems={'center'}>
                  <Grid item xs>
                    <Checkbox defaultChecked={row.enabled} />
                  </Grid>
                  <Grid item>
                    <IconButton size={'small'}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default Patterns;
