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
import {useHistory, useLocation} from "react-router";
import qs from "querystring-es3";
import promiseTry from "../../tools/promiseTry";
import ConfigStruct, {DefaultProxyStruct, ProxyStruct} from "../../tools/ConfigStruct";
import promisifyApi from "../../tools/promisifyApi";

const directTypes = ['system', 'direct'];

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
  const location = useLocation();
  const [proxy, setProxy] = React.useState(null);

  useEffect(() => {
    let isMounted = true;

    const query = qs.parse(location.search.substr(1));
    promiseTry(() => {
      if (query.proxyId) {
        return getConfig().then(({proxies}) => {
          return proxies.find(p => p.id === query.proxyId);
        });
      }
    }).then((proxy) => {
      if (!isMounted) return;
      const currentProxy = DefaultProxyStruct.create(proxy || {});
      setProxy(currentProxy);
    }).catch((err) => {
      console.error('getConfig error: %O', err);
    });

    return () => {
      isMounted = false;
    }
  }, [location.search]);

  if (!proxy) return null;

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
    return () => {
      return promiseTry(async () => {
        const {
          title: titleEl, color: colorEl,
          type: typeEl, host: hostEl, port: portEl,
          username: usernameEl, password: passwordEl
        } = refForm.current.elements;

        const data = {};
        [titleEl, typeEl, colorEl, hostEl, portEl, usernameEl, passwordEl].forEach((element) => {
          if (!element) return;
          const key = element.name;
          let value = element.value;
          if (['port'].includes(key)) {
            value = parseInt(value, 10);
          }
          data[key] = value;
        });

        if (directTypes.includes(data.type)) {
          data.host = '';
          data.port = 0;
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
          if (hasErrors) return;
        }

        if (!data.username) {
          delete data.password;
          delete data.username;
        }

        if (!data.title) {
          data.title = [data.host, data.port].join(':');
        }

        const changedProxy = Object.assign({}, proxy, data);
        ProxyStruct.assert(changedProxy);

        const config = await getConfig();
        const pos = config.proxies.indexOf(proxy);
        if (pos !== -1) {
          config.proxies.splice(pos, 1, changedProxy);
        } else {
          changedProxy.id = '' + Date.now();
          config.proxies.push(changedProxy);
        }

        await promisifyApi('chrome.storage.sync.set')(config);

        return true;
      }).catch((err) => {
        console.error('Save error: %O', err);
        return false;
      });
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
    });
  }, []);

  const handleSaveAndEditPatterns = React.useCallback((e) => {
    e.preventDefault();
    save().then(() => {
      history.push('/patterns');
    });
  }, []);

  const handleSaveAndAddAnother = React.useCallback((e) => {
    e.preventDefault();
    save();
  }, []);

  const handleCancel = React.useCallback((e) => {
    e.preventDefault();
    history.push('/');
  }, []);

  return (
    <>
      <Header title={'Add Proxy'}/>
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
              <Grid item xs={6}>
                <Box m={2}>
                  <MySelect onChange={handleChangeType} name={'type'} label={'Proxy type'} defaultValue={proxy.type}>
                    <MenuItem value="http">HTTP</MenuItem>
                    <MenuItem value="https">HTTPS</MenuItem>
                    <MenuItem value="socks4">SOCKS4</MenuItem>
                    <MenuItem value="socks5">SOCKS5</MenuItem>
                    <MenuItem value="system">System (use system settings)</MenuItem>
                    <MenuItem value="direct">Direct (no proxy)</MenuItem>
                  </MySelect>
                  {!directTypes.includes(type) && (
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
                      <MyInput
                        label="Username (optional)"
                        placeholder="username"
                        defaultValue={proxy.username || ''}
                        name={'username'}
                      />
                      <MyInput
                        label="Password (optional)"
                        placeholder="*****"
                        type={"password"}
                        defaultValue={proxy.password || ''}
                        name={'password'}
                      />
                    </>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box mx={2} mb={2} className={classes.actionBox}>
                  <Button
                    onClick={handleCancel}
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
                  {!directTypes.includes(type) && (
                    <Button
                      onClick={handleSaveAndEditPatterns}
                      variant="contained"
                      className={classes.button}
                      color="secondary"
                    >
                      Save & Edit patterns
                    </Button>
                  )}
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
