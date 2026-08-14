import React, {FC, useCallback, useState} from 'react';

import LanOutlinedIcon from '@mui/icons-material/LanOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import SettingsEthernetRoundedIcon from '@mui/icons-material/SettingsEthernetRounded';
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

import {AUTH_SUPPORTED} from '../../constants';
import type {ProxyMode} from '../../domain/proxy/proxyState';
import {selectProxy} from '../../services/runtime/runtimeClient';
import {ConfigProxy} from '../../tools/index';
import type {MenuItem} from '../../types/index';
import {useActualProxies, useActualState} from '../index';

const defaultItems: MenuItem[] = [
  {title: 'Automatic routing', mode: 'pac_script'},
  {title: 'System settings', mode: 'system'},
];

const Popup = () => {
  const state = useActualState();
  const proxies = useActualProxies();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async (mode: ProxyMode, item: MenuItem | ConfigProxy) => {
    const {id} = item;
    const key = id || mode;
    setPendingKey(key);
    setError(null);

    try {
      if (AUTH_SUPPORTED && 'username' in item && item.username) {
        const granted = await chrome.permissions.request({
          permissions: ['webRequest', 'webRequestAuthProvider'],
          origins: ['<all_urls>'],
        });
        if (!granted) {
          setError('Permission is required to use this proxy login.');
          return;
        }
      }

      await selectProxy(mode, id);
    } catch (err) {
      console.error('Set proxy error: %O', err);
      setError('Could not switch the connection. Try again.');
    } finally {
      setPendingKey(null);
    }
  }, []);

  const isLoading = proxies === null;

  return (
    <Box sx={{width: 320, height: 'fit-content', bgcolor: 'background.paper', overflow: 'hidden'}}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{m: 1, mb: 0}}>
          {error}
        </Alert>
      )}

      {!state && !isLoading && (
        <Alert severity="info" sx={{m: 1, mb: 0, py: 0}}>
          Browser settings control the proxy.
        </Alert>
      )}

      <Box sx={{px: 1, pt: 1}}>
        <Typography variant="overline" color="text.secondary" sx={{px: 1}}>
          Routing mode
        </Typography>
        <List component="nav" aria-label="Proxy routing" disablePadding sx={{mt: 0.5}}>
          {isLoading
            ? Array.from({length: 4}).map((_, index) => (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1.5}
                  sx={{p: 1.25, alignItems: 'center'}}
                >
                  <Skeleton variant="circular" width={30} height={30} />
                  <Box sx={{flex: 1}}>
                    <Skeleton width={`${62 + index * 6}%`} />
                    <Skeleton width="42%" />
                  </Box>
                </Stack>
              ))
            : defaultItems.map((item) => (
                <ProxyItem
                  key={item.mode}
                  item={item}
                  checked={state?.mode === item.mode}
                  mode={item.mode}
                  pending={pendingKey === item.mode}
                  disabled={Boolean(pendingKey)}
                  onClick={handleClick}
                />
              ))}
        </List>
      </Box>

      {!isLoading && proxies.length > 0 && (
        <Box sx={{px: 1, pt: 0.5}}>
          <Typography variant="overline" color="text.secondary" sx={{px: 1}}>
            Saved connections
          </Typography>
          <List component="nav" aria-label="Saved proxy connections" disablePadding sx={{mt: 0.5}}>
            {proxies.map((item) => (
              <ProxyItem
                key={item.id}
                item={item}
                checked={state?.id === item.id}
                mode="fixed_servers"
                pending={pendingKey === item.id}
                disabled={Boolean(pendingKey)}
                onClick={handleClick}
              />
            ))}
          </List>
        </Box>
      )}

      {!isLoading && proxies.length === 0 && (
        <Box sx={{mx: 1.5, my: 1, p: 1.5, borderRadius: 1, bgcolor: 'background.default'}}>
          <Typography variant="body2" sx={{fontWeight: 600}}>
            No saved connections
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Add a proxy in settings to switch to it here.
          </Typography>
        </Box>
      )}

      <Divider sx={{mt: 1}} />
      <List disablePadding>
        <ListItemButton href="./options.html" target="_blank" sx={{px: 1.5, py: 1}}>
          <ListItemIcon sx={{minWidth: 38}}>
            <SettingsEthernetRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Manage connections"
            slotProps={{primary: {sx: {fontWeight: 600, fontSize: '0.9rem'}}}}
          />
          <OpenInNewRoundedIcon sx={{fontSize: 17, color: 'text.secondary'}} />
        </ListItemButton>
      </List>
    </Box>
  );
};

interface ProxyItemProps {
  item: MenuItem | ConfigProxy;
  mode: ProxyMode;
  checked: boolean;
  pending: boolean;
  disabled: boolean;
  onClick: (mode: ProxyMode, item: MenuItem | ConfigProxy) => void;
}

const ProxyItem: FC<ProxyItemProps> = ({item, mode, checked, pending, disabled, onClick}) => {
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      onClick(mode, item);
    },
    [item, mode, onClick],
  );
  const isProxy = 'type' in item;
  const detail = isProxy
    ? item.type === 'direct'
      ? 'No proxy server'
      : `${item.type.toUpperCase()} · ${item.host}:${item.port}`
    : mode === 'pac_script'
      ? 'Match rules in priority order'
      : 'Use your browser configuration';

  return (
    <ListItemButton
      onClick={handleClick}
      selected={checked}
      disabled={disabled}
      aria-current={checked ? 'true' : undefined}
      sx={{
        minHeight: 46,
        mb: 0.25,
        py: 0.25,
        borderRadius: 1,
        border: '1px solid',
        borderColor: checked ? 'primary.main' : 'transparent',
        '&.Mui-selected': {bgcolor: 'primary.light'},
      }}
    >
      <ListItemIcon sx={{minWidth: 34}}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            color: checked ? 'primary.main' : 'text.secondary',
            bgcolor: isProxy ? item.color : checked ? '#d9e6ff' : 'background.default',
            boxShadow: isProxy ? 'inset 0 0 0 7px rgba(255,255,255,0.78)' : undefined,
          }}
        >
          {!isProxy && <LanOutlinedIcon sx={{fontSize: 17}} />}
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={item.title}
        secondary={detail}
        sx={{my: 0}}
        slotProps={{
          primary: {sx: {fontWeight: checked ? 600 : 500, fontSize: '0.82rem'}},
          secondary: {sx: {fontSize: '0.68rem'}, noWrap: true},
        }}
      />
      {pending ? (
        <CircularProgress size={18} />
      ) : checked ? (
        <Typography variant="caption" color="primary.main" sx={{fontWeight: 700, ml: 1}}>
          Active
        </Typography>
      ) : null}
    </ListItemButton>
  );
};

export default Popup;
