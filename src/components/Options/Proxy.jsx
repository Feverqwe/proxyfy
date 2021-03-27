import * as React from "react";
import {useEffect} from "react";
import {
  Box,
  Button,
  FormControl,
  Grid,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from "@material-ui/core";
import getConfig from "../../tools/getConfig";
import {Link} from "react-router-dom";
import {TwitterPicker} from "react-color";
import Header from "../Header";

const useStyles = makeStyles(() => {
  return {
    actionBox: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    button: {
      margin: '8px',
    }
  };
});

const Proxy = React.memo(() => {
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
      <Header title={'Add Proxy'}/>
      <Box p={2}>
        <Paper>
          <Grid container>
            <Grid item xs={6}>
              <Box m={2}>
                <MyInput
                  label={'Title'}
                  placeholder={'title'}
                  defaultValue={'title'}
                />
                <MyColorInput
                  label={'Color'}
                  value={'#66cc66'}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box m={2}>
                <MySelect label={'Proxy type'} value={'HTTP'}>
                  <MenuItem value="HTTP">HTTP</MenuItem>
                  <MenuItem value="HTTPS">HTTPS</MenuItem>
                  <MenuItem value="SOCKS4">SOCKS4</MenuItem>
                  <MenuItem value="SOCKS5">SOCKS5</MenuItem>
                  <MenuItem value="System">System (use system settings)</MenuItem>
                  <MenuItem value="Direct">Direct (no proxy)</MenuItem>
                </MySelect>
                <MyInput
                  label="Proxy IP address or DNS name"
                  placeholder="111.111.111.111, www.example.com"
                />
                <MyInput
                  label="Port"
                  placeholder="3128"
                />
                <MyInput
                  label="Username"
                  placeholder="username"
                />
                <MyInput
                  label="Password"
                  placeholder="*****"
                  type={"password"}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box mx={2} mb={2} className={classes.actionBox}>
                <Button variant="contained" className={classes.button}>
                  Cancel
                </Button>
                <Button variant="contained" className={classes.button} color="secondary">
                  Save & Add another
                </Button>
                <Button
                  component={Link}
                  to={'/patterns'}
                  variant="contained"
                  className={classes.button}
                  color="secondary"
                >
                  Save & Edit patterns
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

const MyInput = React.memo(({label, ...props}) => {
  return (
    <FormControl fullWidth margin={'dense'}>
      <Typography variant={"subtitle1"}>
        {label}
      </Typography>
      <TextField
        variant="outlined"
        size="small"
        {...props}
      />
    </FormControl>
  );
});

const MyColorInput = React.memo(({label, value}) => {
  const [color, setColor] = React.useState(value);
  const [showPicker, setShowPicker] = React.useState(false);

  const handleClick = React.useCallback((e) => {
    e.preventDefault();
    setShowPicker(r => !r);
  }, []);

  const handleChangeColor = React.useCallback((color) => {
    const hex = color.hex;
    setColor(hex);
  }, []);

  return (
    <>
      <FormControl fullWidth margin={'dense'}>
        <Typography variant={"subtitle1"}>
          {label}
        </Typography>
        <TextField
          variant="outlined"
          size="small"
          style={{
            backgroundColor: color,
          }}
          onClick={handleClick}
          value={color}
          disabled
        />
      </FormControl>
      {showPicker && (
        <TwitterPicker
          color={color}
          onChangeComplete={handleChangeColor}
        />
      )}
    </>
  );
});

const MySelect = React.memo(({label, children, ...props}) => {
  return (
    <FormControl fullWidth margin={'dense'}>
      <Typography variant={"subtitle1"}>
        {label}
      </Typography>
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

export default Proxy;
