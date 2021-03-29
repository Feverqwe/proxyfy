import * as React from "react";
import {useEffect} from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from "@material-ui/core";
import getConfig from "../../tools/getConfig";
import Header from "../Header";
import {Redirect, useHistory, useLocation} from "react-router";
import qs from "querystring-es3";
import promiseTry from "../../tools/promiseTry";
import ConfigStruct, {DefaultProxyStruct} from "../../tools/ConfigStruct";
import promisifyApi from "../../tools/promisifyApi";
import {Link} from "react-router-dom";
import getId from "../../tools/getId";
import getObjectId from "../../tools/getObjectId";
import {localhostPresets, matchAllPresets} from "./Patterns";
import MyColorInput from "./MyColorInput";

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
    hidden: {
      visibility: 'hidden',
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

  const onReset = React.useCallback(() => {
    setProxy(DefaultProxyStruct.create({}));
  }, []);

  if (!proxy) return null;

  if (isRedirect) {
    return (
      <Redirect to={'/'} />
    );
  }

  return (
    <ProxyLoaded key={getObjectId(proxy)} proxy={proxy} onReset={onReset}/>
  );
});

const ProxyLoaded = React.memo(({proxy, onReset}) => {
  const history = useHistory();
  const classes = useStyles();

  const refForm = React.useRef();
  const [isValidHost, setValidHost] = React.useState(true);
  const [isValidPort, setValidPort] = React.useState(true);
  const [type, setType] = React.useState(proxy.type);
  const isNew = React.useMemo(() => !proxy.id, []);

  const save = React.useMemo(() => {
    return async () => {
      const {
        title: titleEl, color: colorEl,
        type: typeEl, host: hostEl, port: portEl,
        enabled: enabledEl, useMatchAllPreset: useMatchAllPresetEl, useLocalhostPreset: useLocalhostPresetEl,
        badgeText: badgeTextEl, badgeColor: badgeColorEl,
      } = refForm.current.elements;

      const data = {};
      [titleEl, typeEl, colorEl, hostEl, portEl, badgeTextEl, badgeColorEl].forEach((element) => {
        if (!element) return;
        const key = element.name;
        let value = element.value;
        if (['port'].includes(key)) {
          value = parseInt(value, 10);
        }
        data[key] = value;
      });

      [enabledEl, useMatchAllPresetEl, useLocalhostPresetEl].forEach((element) => {
        if (!element) return;
        const key = element.name;
        let value = element.checked;
        data[key] = value;
      });

      const useMatchAllPreset = data.useMatchAllPreset;
      const useLocalhostPreset = data.useLocalhostPreset;
      delete data.useMatchAllPreset;
      delete data.useLocalhostPreset;

      if (noProxyTypes.includes(data.type)) {
        setValidHost(true);
        setValidPort(true);
        delete data.host;
        delete data.port;
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

      if (useMatchAllPreset) {
        matchAllPresets.forEach(({name, pattern, type}) => {
          changedProxy.whitePatterns.push({
            id: getId(),
            enabled: true,
            name, pattern, type,
          });
        });
      }

      if (useLocalhostPreset) {
        localhostPresets.forEach(({name, pattern, type}) => {
          changedProxy.blackPatterns.push({
            id: getId(),
            enabled: true,
            name, pattern, type,
          });
        });
      }

      const config = await getConfig();
      if (isNew) {
        changedProxy.id = getId();
        config.proxies.push(changedProxy);
      } else {
        const existsProxy = config.proxies.find(p => p.id === proxy.id);
        const pos = config.proxies.indexOf(existsProxy);
        if (pos === -1) {
          throw new Error('Proxy is not found');
        }
        config.proxies.splice(pos, 1, changedProxy);
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
    save().then(() => {
      if (isNew) {
        onReset();
      } else {
        history.push('/proxy');
      }
    }).catch((err) => {
      console.error('Save error: %O', err);
    });
  }, []);

  const isDirect = noProxyTypes.includes(type);

  return (
    <>
      <Header title={isNew ? 'Add Proxy' : 'Edit proxy'}/>
      <Box component={Paper} m={2}>
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
                  label={'Icon color'}
                  value={proxy.color}
                  name={'color'}
                  iconType={'logo'}
                />
                <MyInput
                  label={'Badge text'}
                  defaultValue={proxy.badgeText || ''}
                  name={'badgeText'}
                />
                <MyColorInput
                  label={'Badge color'}
                  value={proxy.badgeColor || ''}
                  name={'badgeColor'}
                  format={'rgba'}
                />
                {isNew && (
                  <FormControl fullWidth margin={'dense'}>
                    <Typography variant={"subtitle1"}>
                      Pattern Shortcuts
                    </Typography>
                    <Box component={Paper} p={1} variant="outlined">
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox defaultChecked={true} name="enabled" />}
                          label="Enabled"
                        />
                        <FormControlLabel
                          control={<Checkbox defaultChecked={true} name="useMatchAllPreset" />}
                          label="Add whitelist pattern to match all URLs"
                        />
                        <FormControlLabel
                          control={<Checkbox defaultChecked={false} name="useLocalhostPreset" />}
                          label="Do not use for localhost and intranet/private IP addresses"
                        />
                      </FormGroup>
                    </Box>
                  </FormControl>
                )}
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box m={2}>
                <MySelect onChange={handleChangeType} name={'type'} label={'Proxy type'} defaultValue={proxy.type}>
                  <MenuItem value="http">HTTP</MenuItem>
                  <MenuItem value="https">HTTPS</MenuItem>
                  <MenuItem value="socks4">SOCKS4</MenuItem>
                  <MenuItem value="socks5">SOCKS5</MenuItem>
                  <MenuItem value="quic">QUIC</MenuItem>
                  <MenuItem value="direct">Direct (no proxy)</MenuItem>
                </MySelect>
                <MyInput
                  label="Proxy IP address or DNS name"
                  placeholder="111.111.111.111, www.example.com"
                  defaultValue={proxy.host}
                  name={'host'}
                  isError={!isValidHost}
                  hidden={isDirect}
                />
                <MyInput
                  label="Port"
                  placeholder={'3128'}
                  defaultValue={String(proxy.port)}
                  name={'port'}
                  isError={!isValidPort}
                  hidden={isDirect}
                />
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
      </Box>
    </>
  );
});

const MyInput = React.memo(({label, isError = false, hidden, ...props}) => {
  const classes = useStyles();

  return (
    <FormControl fullWidth margin={'dense'} className={hidden ? classes.hidden : ''}>
      <Typography variant={"subtitle1"}>
        {label}
      </Typography>
      <TextField
        variant="outlined"
        size="small"
        error={isError}
        autoComplete={'off'}
        {...props}
      />
    </FormControl>
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
