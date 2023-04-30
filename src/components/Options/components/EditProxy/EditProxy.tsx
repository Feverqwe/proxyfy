import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {useNavigate, useLocation} from 'react-router';
import {Link} from 'react-router-dom';
import getConfig from '../../../../tools/getConfig';
import Header from '../../../Header';
import ConfigStruct, {
  DefaultProxyStruct,
  ConfigProxy,
  ProxyPattern,
  GenericProxyType,
  DirectProxyType,
} from '../../../../tools/ConfigStruct';
import getId from '../../../../tools/getId';
import getObjectId from '../../../../tools/getObjectId';
import {localhostPresets, matchAllPresets} from '../Patterns/Patterns';
import MyColorInput from '../../MyColorInput';
import getRandomInt from '../../../../tools/getRandomInt';
import Notification from '../../Notification';
import MySelect from '../../MySelect';
import MyInput from '../../MyInput';
import ActionBox from '../../ActionBox';
import MyButtonM from '../../MyButtonM';
import {AUTH_SUPPORTED} from '../../../../constants';

const noProxyTypes = [DirectProxyType.Direct];
const authProxyTypes = AUTH_SUPPORTED ? [GenericProxyType.Http, GenericProxyType.Https] : [];

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

const EditProxy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [proxy, setProxy] = useState<ConfigProxy | null>(null);

  const handleNewProxy = useCallback(() => {
    const newProxy = DefaultProxyStruct.create({
      color: badgeColors[getRandomInt(0, badgeColors.length)],
    }) as ConfigProxy;
    setProxy(newProxy);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const query = new URLSearchParams(location.search);

    (async () => {
      try {
        let proxy: undefined | ConfigProxy | null = null;
        if (query.has('id')) {
          const {proxies} = await getConfig();
          proxy = proxies.find((p) => p.id === query.get('id'));
        }
        if (!isMounted) return;

        if (proxy === undefined) {
          navigate('/');
        } else if (proxy === null) {
          handleNewProxy();
        } else {
          const currentProxy = DefaultProxyStruct.create(proxy) as ConfigProxy;
          setProxy(currentProxy);
        }
      } catch (err) {
        console.error('getConfig error: %O', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [location.search, navigate, handleNewProxy]);

  if (!proxy) return null;

  return <ProxyLoaded key={getObjectId(proxy)} proxy={proxy} onReset={handleNewProxy} />;
};

interface ChangedProxy extends Omit<ConfigProxy, 'whitePatterns' | 'blackPatterns'> {
  whitePatterns: (ProxyPattern & {id?: string})[];
  blackPatterns: (ProxyPattern & {id?: string})[];
}

interface ProxyLoadedProps {
  proxy: ConfigProxy;
  onReset: () => void;
}

enum FieldType {
  String = 'string',
  Number = 'number',
  Checkbox = 'checkbox',
}

const ProxyLoaded: FC<ProxyLoadedProps> = ({proxy, onReset}) => {
  const navigate = useNavigate();

  const refForm = useRef<(HTMLFormElement & {elements: Record<string, HTMLInputElement>}) | null>(
    null,
  );
  const [isValidHost, setValidHost] = useState(true);
  const [isValidPort, setValidPort] = useState(true);
  const [type, setType] = useState(proxy.type);
  const [notify, setNotify] = useState<{text: string} | null>(null);

  const isNew = useMemo(() => !proxy.id, [proxy.id]);

  const refFields = useRef<{name: string; type: FieldType}[]>([]);
  refFields.current = [];
  const addField = useCallback(
    (name: string, {type = FieldType.String}: {type?: FieldType} = {}) => {
      refFields.current.push({name, type});
      const props: {name: string; defaultValue?: string} = {name};
      if ([FieldType.Number, FieldType.String].includes(type) && name in proxy) {
        props.defaultValue = String(proxy[name as keyof ConfigProxy]);
      }
      return props;
    },
    [proxy],
  );

  const saveForm = useCallback(async () => {
    const form = refForm.current;
    if (!form) {
      throw new Error('Form is empty');
    }

    const data: Record<string, number | string | boolean> = {};
    refFields.current.forEach(({name, type}) => {
      const el = form.elements[name];
      let value;
      if (type === FieldType.String) {
        value = el.value;
      } else if (type === FieldType.Number) {
        value = parseInt(el.value, 10);
      } else if (type === FieldType.Checkbox) {
        value = el.checked;
      }
      if (value !== undefined) {
        data[name] = value;
      }
    });

    const {useMatchAllPreset, useLocalhostPreset} = data;
    delete data.useMatchAllPreset;
    delete data.useLocalhostPreset;

    if (!noProxyTypes.includes(data.type as DirectProxyType)) {
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
    await chrome.storage.sync.set(config);

    return changedProxy.id;
  }, [isNew, proxy, refFields]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    async function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        const {keyCode} = e;
        switch (keyCode) {
          case 83:
            e.preventDefault();
            try {
              const id = await saveForm();
              if (isNew) {
                navigate(`/proxy?${new URLSearchParams({id}).toString()}`);
              } else {
                setNotify({text: 'Saved'});
              }
            } catch (err) {
              console.error('Save error: %O', err);
            }
            break;
        }
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveForm, isNew, navigate]);

  const handleChangeType = useCallback((e) => {
    const {value} = e.target;
    setType(value);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleSave = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await saveForm();
        navigate('/');
      } catch (err) {
        console.error('Save error: %O', err);
      }
    },
    [navigate, saveForm],
  );

  const handleSaveAndEditPatterns = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const id = await saveForm();
        navigate(`/patterns?${new URLSearchParams({id}).toString()}`);
      } catch (err) {
        console.error('Save error: %O', err);
      }
    },
    [navigate, saveForm],
  );

  const handleSaveAndAddAnother = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await saveForm();
        if (isNew) {
          onReset();
        } else {
          navigate('/proxy');
        }
      } catch (err) {
        console.error('Save error: %O', err);
      }
    },
    [navigate, isNew, onReset, saveForm],
  );

  return (
    <>
      <Header title={isNew ? 'Add Proxy' : 'Edit proxy'} />
      <Box component={Paper} m={2}>
        <form ref={refForm} onSubmit={handleSubmit}>
          <Grid container>
            <Grid item xs={6}>
              <Box m={2}>
                <MyInput label="Title (optional)" placeholder="title" {...addField('title')} />
                <MyColorInput label="Icon color" iconType="logo" {...addField('color')} />
                <MyInput label="Badge text" {...addField('badgeText')} />
                <MyColorInput label="Badge color" format="rgba" {...addField('badgeColor')} />
                {isNew && (
                  <FormControl fullWidth margin="dense">
                    <Typography variant="subtitle1">Pattern Shortcuts</Typography>
                    <Box component={Paper} p={1} variant="outlined">
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              defaultChecked={true}
                              {...addField('enabled', {type: FieldType.Checkbox})}
                            />
                          }
                          label="Enabled"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              defaultChecked={true}
                              {...addField('useMatchAllPreset', {type: FieldType.Checkbox})}
                            />
                          }
                          label="Add whitelist pattern to match all URLs"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              defaultChecked={false}
                              {...addField('useLocalhostPreset', {type: FieldType.Checkbox})}
                            />
                          }
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
                <MySelect onChange={handleChangeType} label="Proxy type" {...addField('type')}>
                  <MenuItem value="http">HTTP</MenuItem>
                  <MenuItem value="https">HTTPS</MenuItem>
                  <MenuItem value="socks4">SOCKS4</MenuItem>
                  <MenuItem value="socks5">SOCKS5</MenuItem>
                  <MenuItem value="quic">QUIC</MenuItem>
                  <MenuItem value="direct">Direct (no proxy)</MenuItem>
                </MySelect>
                {!noProxyTypes.includes(type as DirectProxyType) && (
                  <>
                    <MyInput
                      label="Proxy IP address or DNS name"
                      placeholder="111.111.111.111, www.example.com"
                      isError={!isValidHost}
                      {...addField('host')}
                    />
                    <MyInput
                      label="Port"
                      placeholder="3128"
                      isError={!isValidPort}
                      type="number"
                      {...addField('port', {type: FieldType.Number})}
                    />
                    {authProxyTypes.includes(type as GenericProxyType) && (
                      <>
                        <MyInput
                          label="Username (optional)"
                          placeholder="username"
                          {...addField('username', {type: FieldType.String})}
                        />
                        <MyInput
                          label="Password (optional)"
                          placeholder="*****"
                          type="password"
                          {...addField('password', {type: FieldType.String})}
                        />
                      </>
                    )}
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

export default EditProxy;
