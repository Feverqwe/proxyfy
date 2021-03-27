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

  const list = [{
    name: 'all URLs',
    pattern: '*',
    type: 'wildcard',
    enabled: true,
  }];

  return (
    <Box p={2}>
      <Paper>
        <Grid container>
          <Grid item xs={12}>
            <Box m={2}>
              <Box my={2}>
                <Typography variant={'h5'}>
                  White Patterns
                </Typography>
                <PatternList list={list}/>
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
              <PatternList list={[]}/>
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
              <Button variant="contained" className={classes.button}>
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
                <Grid container direction="row">
                  <Grid item xs>
                    <Checkbox defaultChecked={row.enabled} />
                  </Grid>
                  <Grid item>
                  </Grid>
                  <IconButton aria-label="delete">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
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
