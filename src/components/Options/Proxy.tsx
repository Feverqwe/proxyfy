import React, {FC, useEffect} from 'react';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  Paper,
  Typography,
} from '@mui/material';
import {Redirect, useHistory, useLocation} from 'react-router';
import {Link} from 'react-router-dom';
import getConfig from '../../tools/getConfig';
import Header from '../Header';
import ConfigStruct, {
  DefaultProxyStruct,
  ConfigProxy,
  ProxyPattern,
} from '../../tools/ConfigStruct';
import promisifyApi from '../../tools/promisifyApi';
import getId from '../../tools/getId';
import getObjectId from '../../tools/getObjectId';
import {localhostPresets, matchAllPresets} from './Patterns';
import MyColorInput from './MyColorInput';
import getRandomInt from '../../tools/getRandomInt';
import Notification from './Notification';
import MySelect from './MySelect';
import MyInput from './MyInput';
import ActionBox from './ActionBox';
import MyButtonM from './MyButtonM';

const qs = require('querystring-es3');

const AUTH_SUPPORTED = false;
const noProxyTypes = ['direct'];
const badgeColors = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffeb3b',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b',
];

const Proxy = React.memo(() => {
  const location = useLocation();
  const [proxy, setProxy] = React.useState<ConfigProxy | null>(null);
  const [isRedirect, setRedirect] = React.useState(false);

  useEffect(() => {
    let isMounted = true;

    const query = qs.parse(location.search.substr(1));

    (async () => {
      try {
        let proxy: undefined | ConfigProxy;
        if (query.id) {
          const {proxies} = await getConfig();
          proxy = proxies.find((p) => p.id === query.id);
        }

        if (!isMounted) return;
        if (proxy === undefined) {
          setRedirect(true);
        } else {
          const currentProxy = DefaultProxyStruct.create(proxy || {}) as ConfigProxy;
          if (!proxy) {
            currentProxy.color = badgeColors[getRandomInt(0, badgeColors.length)];
          }
          setProxy(currentProxy);
        }
      } catch (err) {
        console.error('getConfig error: %O', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [location.search]);

  const onReset = React.useCallback(() => {
    setProxy(DefaultProxyStruct.create({}) as ConfigProxy);
  }, []);

  if (!proxy) return null;

  if (isRedirect) {
    return <Redirect to="/" />;
  }

  return <ProxyLoaded key={getObjectId(proxy)} proxy={proxy} onReset={onReset} />;
});

interface ChangedProxy extends Omit<ConfigProxy, 'whitePatterns' | 'blackPatterns'> {
  whitePatterns: (ProxyPattern & {id?: string})[];
  blackPatterns: (ProxyPattern & {id?: string})[];
}

interface ProxyLoadedProps {
  proxy: ConfigProxy;
  onReset: () => void;
}

const ProxyLoaded: FC<ProxyLoadedProps> = ({proxy, onReset}) => {
  const history = useHistory();

  const refForm = React.useRef<
    (HTMLFormElement & {elements: Record<string, HTMLInputElement>}) | null
  >(null);
  const [isValidHost, setValidHost] = React.useState(true);
  const [isValidPort, setValidPort] = React.useState(true);
  const [type, setType] = React.useState(proxy.type);
  const [notify, setNotify] = React.useState<{text: string} | null>(null);

  const isNew = React.useMemo(() => !proxy.id, [proxy.id]);

  const save = React.useMemo(() => {
    return async () => {
      const form = refForm.current;
      if (!form) return;
      const {
        title: titleEl,
        color: colorEl,
        type: typeEl,
        host: hostEl,
        port: portEl,
        username: usernameEl,
        password: passwordEl,
        enabled: enabledEl,
        useMatchAllPreset: useMatchAllPresetEl,
        useLocalhostPreset: useLocalhostPresetEl,
        badgeText: badgeTextEl,
        badgeColor: badgeColorEl,
      } = form.elements;

      const data: Record<string, number | string | boolean> = {};
      [
        titleEl,
        typeEl,
        colorEl,
        hostEl,
        portEl,
        usernameEl,
        passwordEl,
        badgeTextEl,
        badgeColorEl,
      ].forEach((element) => {
        if (!element) return;
        const key = element.name;
        const {value} = element;
        if (['port'].includes(key)) {
          data[key] = parseInt(value, 10);
        } else {
          data[key] = value;
        }
      });

      [enabledEl, useMatchAllPresetEl, useLocalhostPresetEl].forEach((element) => {
        if (!element) return;
        const key = element.name;
        const value = element.checked;
        data[key] = value;
      });

      const {useMatchAllPreset} = data;
      const {useLocalhostPreset} = data;
      delete data.useMatchAllPreset;
      delete data.useLocalhostPreset;

      if (noProxyTypes.includes(data.type as string)) {
        setValidHost(true);
        setValidPort(true);
        delete data.host;
        delete data.port;
        delete data.password;
        delete data.username;
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

        if (!data.username) {
          delete data.password;
          delete data.username;
        }
      }

      if (!data.title) {
        if (data.type === 'direct') {
          data.title = 'Direct';
        } else {
          data.title = [data.host, data.port].join(':');
        }
      }

      const changedProxy: ChangedProxy = {...proxy, ...data};

      if (useMatchAllPreset) {
        matchAllPresets.forEach(({name, pattern, type}) => {
          changedProxy.whitePatterns.push({
            id: getId(),
            enabled: true,
            name,
            pattern,
            type,
          });
        });
      }

      if (useLocalhostPreset) {
        localhostPresets.forEach(({name, pattern, type}) => {
          changedProxy.blackPatterns.push({
            id: getId(),
            enabled: true,
            name,
            pattern,
            type,
          });
        });
      }

      const config = await getConfig();
      if (isNew) {
        changedProxy.id = getId();
        config.proxies.push(changedProxy as ConfigProxy);
      } else {
        const existsProxy = config.proxies.find((p) => p.id === proxy.id);
        const pos = config.proxies.indexOf(existsProxy as ConfigProxy);
        if (pos === -1) {
          throw new Error('Proxy is not found');
        }
        config.proxies.splice(pos, 1, changedProxy as ConfigProxy);
      }
      const _ = ConfigStruct.assert(config);
      await promisifyApi('chrome.storage.sync.set')(config);

      return changedProxy.id;
    };
  }, [isNew, proxy]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        const {keyCode} = e;
        switch (keyCode) {
          case 83:
            e.preventDefault();
            save().then(
              () => {
                setNotify({text: 'Saved'});
              },
              (err) => {
                console.error('Save error: %O', err);
              },
            );
            break;
        }
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [save]);

  const handleChangeType = React.useCallback((e) => {
    const {value} = e.target;
    setType(value);
  }, []);

  const handleSubmit = React.useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleSave = React.useCallback(
    (e) => {
      e.preventDefault();
      save().then(
        () => {
          history.push('/');
        },
        (err) => {
          console.error('Save error: %O', err);
        },
      );
    },
    [history, save],
  );

  const handleSaveAndEditPatterns = React.useCallback(
    (e) => {
      e.preventDefault();
      save()
        .then((id) => {
          history.push(`/patterns?${qs.stringify({id})}`);
        })
        .catch((err) => {
          console.error('Save error: %O', err);
        });
    },
    [history, save],
  );

  const handleSaveAndAddAnother = React.useCallback(
    (e) => {
      e.preventDefault();
      save()
        .then(() => {
          if (isNew) {
            onReset();
          } else {
            history.push('/proxy');
          }
        })
        .catch((err) => {
          console.error('Save error: %O', err);
        });
    },
    [history, isNew, onReset, save],
  );

  const isDirect = noProxyTypes.includes(type);

  return (
    <>
      <Header title={isNew ? 'Add Proxy' : 'Edit proxy'} />
      <Box component={Paper} m={2}>
        <form ref={refForm} onSubmit={handleSubmit}>
          <Grid container>
            <Grid item xs={6}>
              <Box m={2}>
                <MyInput
                  label="Title (optional)"
                  placeholder="title"
                  defaultValue={proxy.title}
                  name="title"
                />
                <MyColorInput label="Icon color" value={proxy.color} name="color" iconType="logo" />
                <MyInput label="Badge text" defaultValue={proxy.badgeText || ''} name="badgeText" />
                <MyColorInput
                  label="Badge color"
                  value={proxy.badgeColor || ''}
                  name="badgeColor"
                  format="rgba"
                />
                {isNew && (
                  <FormControl fullWidth margin="dense">
                    <Typography variant="subtitle1">Pattern Shortcuts</Typography>
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
                <MySelect
                  onChange={handleChangeType}
                  name="type"
                  label="Proxy type"
                  defaultValue={proxy.type}
                >
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
                  defaultValue={'host' in proxy ? proxy.host : ''}
                  name="host"
                  isError={!isValidHost}
                  hidden={isDirect}
                />
                <MyInput
                  label="Port"
                  placeholder="3128"
                  defaultValue={String('port' in proxy ? proxy.port : '')}
                  name="port"
                  isError={!isValidPort}
                  hidden={isDirect}
                  type="number"
                />
                {AUTH_SUPPORTED && (
                  <>
                    <MyInput
                      label="Username (optional)"
                      placeholder="username"
                      defaultValue={'username' in proxy ? proxy.username || '' : ''}
                      name="username"
                    />
                    <MyInput
                      label="Password (optional)"
                      placeholder="*****"
                      type="password"
                      defaultValue={'password' in proxy ? proxy.password || '' : ''}
                      name="password"
                    />
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <ActionBox mx={2} mb={2}>
                <MyButtonM component={Link} to="/" variant="contained">
                  Cancel
                </MyButtonM>
                <MyButtonM onClick={handleSaveAndAddAnother} variant="contained" color="secondary">
                  Save & Add another
                </MyButtonM>
                <MyButtonM
                  onClick={handleSaveAndEditPatterns}
                  variant="contained"
                  color="secondary"
                >
                  Save & Edit patterns
                </MyButtonM>
                <MyButtonM onClick={handleSave} variant="contained" color="primary">
                  Save
                </MyButtonM>
              </ActionBox>
            </Grid>
          </Grid>
        </form>
      </Box>
      {notify && <Notification key={getObjectId(notify)} notify={notify} />}
    </>
  );
};

export default Proxy;
