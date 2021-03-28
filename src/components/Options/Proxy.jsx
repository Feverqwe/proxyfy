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
import {TwitterPicker} from "react-color";
import Header from "../Header";
import {Redirect, useHistory, useLocation} from "react-router";
import qs from "querystring-es3";
import promiseTry from "../../tools/promiseTry";
import ConfigStruct, {DefaultProxyStruct} from "../../tools/ConfigStruct";
import promisifyApi from "../../tools/promisifyApi";
import {Link} from "react-router-dom";
import getId from "../../tools/getId";

const noProxyTypes = ['direct'];

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
    rightBox: {
      minHeight: '432px',
    }
  };
});

const Proxy = React.memo(() => {
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
      if (proxy === undefined) {
        setRedirect(true);
      } else {
        const currentProxy = DefaultProxyStruct.create(proxy || {});
        setProxy(currentProxy);
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
    <ProxyLoaded key={proxy.id} proxy={proxy}/>
  );
});

const ProxyLoaded = React.memo(({proxy}) => {
  const history = useHistory();
  const classes = useStyles();

  const refForm = React.useRef();
  const [isValidHost, setValidHost] = React.useState(true);
  const [isValidPort, setValidPort] = React.useState(true);
  const [type, setType] = React.useState(proxy.type);

  const save = React.useMemo(() => {
    return async () => {
      const {
        title: titleEl, color: colorEl,
        type: typeEl, host: hostEl, port: portEl,
      } = refForm.current.elements;

      const data = {};
      [titleEl, typeEl, colorEl, hostEl, portEl].forEach((element) => {
        if (!element) return;
        const key = element.name;
        let value = element.value;
        if (['port'].includes(key)) {
          value = parseInt(value, 10);
        }
        data[key] = value;
      });

      if (noProxyTypes.includes(data.type)) {
        setValidHost(true);
        setValidPort(true);
      } else {
        let hasErrors = false;
        if (!data.host) {
          hasErrors = true;
          setValidHost(false);
        } else {
          setValidHost(true);
        }
        if (!data.port) {
          hasErrors = true;
          setValidPort(false);
        } else {
          setValidPort(true);
        }
        if (hasErrors) {
          throw new Error('Incorrect data');
        }
      }

      if (!data.title) {
        if (data.type === 'direct') {
          data.title = 'Direct';
        } else {
          data.title = [data.host, data.port].join(':');
        }
      }

      const changedProxy = Object.assign({}, proxy, data);

      const config = await getConfig();
      const existsProxy = config.proxies.find(p => p.id === proxy.id);
      const pos = config.proxies.indexOf(existsProxy);
      if (pos !== -1) {
        config.proxies.splice(pos, 1, changedProxy);
      } else {
        changedProxy.id = getId();
        config.proxies.push(changedProxy);
      }
      ConfigStruct.assert(config);
      await promisifyApi('chrome.storage.sync.set')(config);

      return changedProxy.id;
    };
  }, []);

  const handleChangeType = React.useCallback((e) => {
    const value = e.target.value;
    setType(value);
  }, []);

  const handleSubmit = React.useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleSave = React.useCallback((e) => {
    e.preventDefault();
    save().then(() => {
      history.push('/');
    }).catch((err) => {
      console.error('Save error: %O', err);
    });
  }, []);

  const handleSaveAndEditPatterns = React.useCallback((e) => {
    e.preventDefault();
    save().then((id) => {
      history.push('/patterns?' + qs.stringify({id}));
    }).catch((err) => {
      console.error('Save error: %O', err);
    });
  }, []);

  const handleSaveAndAddAnother = React.useCallback((e) => {
    e.preventDefault();
    save().catch((err) => {
      console.error('Save error: %O', err);
    });
  }, []);

  return (
    <>
      <Header title={proxy.id ? 'Edit proxy' : 'Add Proxy'}/>
      <Box p={2}>
        <Paper>
          <form ref={refForm} onSubmit={handleSubmit}>
            <Grid container>
              <Grid item xs={6}>
                <Box m={2}>
                  <MyInput
                    label={'Title (optional)'}
                    placeholder={'title'}
                    defaultValue={proxy.title}
                    name={'title'}
                  />
                  <MyColorInput
                    label={'Color'}
                    value={proxy.color}
                    name={'color'}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} className={classes.rightBox}>
                <Box m={2}>
                  <MySelect onChange={handleChangeType} name={'type'} label={'Proxy type'} defaultValue={proxy.type}>
                    <MenuItem value="http">HTTP</MenuItem>
                    <MenuItem value="https">HTTPS</MenuItem>
                    <MenuItem value="socks4">SOCKS4</MenuItem>
                    <MenuItem value="socks5">SOCKS5</MenuItem>
                    <MenuItem value="direct">Direct (no proxy)</MenuItem>
                  </MySelect>
                  {!noProxyTypes.includes(type) && (
                    <>
                      <MyInput
                        label="Proxy IP address or DNS name"
                        placeholder="111.111.111.111, www.example.com"
                        defaultValue={proxy.host}
                        name={'host'}
                        isError={!isValidHost}
                      />
                      <MyInput
                        label="Port"
                        placeholder={'3128'}
                        defaultValue={String(proxy.port)}
                        name={'port'}
                        isError={!isValidPort}
                      />
                    </>
                  )}
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
                  <Button
                    onClick={handleSaveAndAddAnother}
                    variant="contained"
                    className={classes.button}
                    color="secondary"
                  >
                    Save & Add another
                  </Button>
                  <Button
                    onClick={handleSaveAndEditPatterns}
                    variant="contained"
                    className={classes.button}
                    color="secondary"
                  >
                    Save & Edit patterns
                  </Button>
                  <Button onClick={handleSave} variant="contained" className={classes.button} color="primary">
                    Save
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </>
  );
});

const MyInput = React.memo(({label, isError = false, ...props}) => {
  return (
    <FormControl fullWidth margin={'dense'}>
      <Typography variant={"subtitle1"}>
        {label}
      </Typography>
      <TextField
        variant="outlined"
        size="small"
        error={isError}
        {...props}
      />
    </FormControl>
  );
});

const MyColorInput = React.memo(({label, value, ...props}) => {
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
          {...props}
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
